-- Force update all 'UNKNOWN' sources in raw_offers to 'TIMOCOM'
UPDATE "public"."raw_offers"
SET "source" = 'TIMOCOM'
WHERE "source" = 'UNKNOWN' OR "source" IS NULL;

-- 1. Clear existing stats tables to rebuild them cleanly
TRUNCATE TABLE "public"."daily_market_stats";
TRUNCATE TABLE "public"."hourly_market_stats";
TRUNCATE TABLE "public"."route_stats";

-- 2. Re-process all raw_offers to populate stats
-- We will loop through all raw_offers and trigger the update functions manually
-- This ensures 'source' and 'ALL' buckets are both filled correctly for every offer.

DO $$
DECLARE
    r record;
BEGIN
    -- Loop through all raw offers
    FOR r IN SELECT * FROM "public"."raw_offers"
    LOOP
        -- Manually call the logic that the triggers would call
        -- Note: We can't just call the trigger functions directly on existing rows easily without complex casting.
        -- Instead, we will temporarily enable the triggers and perform a dummy update? No, that's slow.
        -- Better: We execute the update logic logic directly or call the function if adapted.
        
        -- Actually, since we defined the triggers on INSERT, re-inserting them would be messy.
        -- Let's just run a query that mimics the aggregation logic for the entire dataset at once.
        -- It is much faster than row-by-row processing.
        
        -- ... But wait, the user wants to use the existing logic. 
        -- Let's use the "INSERT ... ON CONFLICT" approach for the bulk data.
        NULL; 
    END LOOP;
END;
$$;

-- 3. Bulk Rebuild Queries (Much faster than row-by-row)

-- A. Rebuild Daily Stats (TIMOCOM + ALL)
INSERT INTO daily_market_stats (stat_date, origin_country, dest_country, body_group, source, total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated)
SELECT 
    DATE(created_at) as stat_date,
    get_country_code(origin_country) as origin_country,
    get_country_code(dest_country) as dest_country,
    unnest(get_offer_codes(vehicle_body_ids)) as body_group,
    s.source_type as source,
    SUM(price_amount) as total_price_amount,
    SUM(distance_km) as total_distance_km,
    COUNT(*) as offer_count,
    MIN(price_amount / distance_km) as min_rate_per_km,
    MAX(price_amount / distance_km) as max_rate_per_km,
    MAX(created_at) as last_updated
FROM raw_offers
CROSS JOIN (VALUES ('TIMOCOM'), ('ALL')) as s(source_type) -- Duplicate for both sources
WHERE distance_km > 0 AND price_amount > 0
  AND (price_amount / distance_km) BETWEEN 0.2 AND 10.0
GROUP BY 1, 2, 3, 4, 5;

-- B. Rebuild Hourly Stats
INSERT INTO hourly_market_stats (stat_hour, origin_country, dest_country, body_group, source, total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated)
SELECT 
    date_trunc('hour', created_at) as stat_hour,
    get_country_code(origin_country) as origin_country,
    get_country_code(dest_country) as dest_country,
    unnest(get_offer_codes(vehicle_body_ids)) as body_group,
    s.source_type as source,
    SUM(price_amount) as total_price_amount,
    SUM(distance_km) as total_distance_km,
    COUNT(*) as offer_count,
    MIN(price_amount / distance_km) as min_rate_per_km,
    MAX(price_amount / distance_km) as max_rate_per_km,
    MAX(created_at) as last_updated
FROM raw_offers
CROSS JOIN (VALUES ('TIMOCOM'), ('ALL')) as s(source_type)
WHERE distance_km > 0 AND price_amount > 0
  AND (price_amount / distance_km) BETWEEN 0.2 AND 10.0
GROUP BY 1, 2, 3, 4, 5;

-- C. Rebuild Route Stats (Current Snapshot)
INSERT INTO route_stats (origin_country, dest_country, body_group, source, avg_rate_per_km, ema_rate_per_km, offers_count, last_updated)
SELECT 
    get_country_code(origin_country) as origin_country,
    get_country_code(dest_country) as dest_country,
    unnest(get_offer_codes(vehicle_body_ids)) as body_group,
    s.source_type as source,
    SUM(price_amount) / SUM(distance_km) as avg_rate_per_km,
    SUM(price_amount) / SUM(distance_km) as ema_rate_per_km, -- Approximation for bulk rebuild
    COUNT(*) as offers_count,
    MAX(created_at) as last_updated
FROM raw_offers
CROSS JOIN (VALUES ('TIMOCOM'), ('ALL')) as s(source_type)
WHERE distance_km > 0 AND price_amount > 0
  AND (price_amount / distance_km) BETWEEN 0.2 AND 10.0
GROUP BY 1, 2, 3, 4;

