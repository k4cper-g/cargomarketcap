-- 1. Alter tables to add 'source' column
ALTER TABLE "public"."daily_market_stats"
ADD COLUMN IF NOT EXISTS "source" "text" DEFAULT 'ALL' NOT NULL;

ALTER TABLE "public"."hourly_market_stats"
ADD COLUMN IF NOT EXISTS "source" "text" DEFAULT 'ALL' NOT NULL;

ALTER TABLE "public"."route_stats"
ADD COLUMN IF NOT EXISTS "source" "text" DEFAULT 'ALL' NOT NULL;

-- 2. Update Unique Constraints (Drop old, Add new with source)

-- daily_market_stats
ALTER TABLE "public"."daily_market_stats"
DROP CONSTRAINT IF EXISTS "daily_market_stats_stat_date_origin_country_dest_country_bo_key";

ALTER TABLE "public"."daily_market_stats"
ADD CONSTRAINT "daily_market_stats_unique_key"
UNIQUE ("stat_date", "origin_country", "dest_country", "body_group", "source");

-- hourly_market_stats
ALTER TABLE "public"."hourly_market_stats"
DROP CONSTRAINT IF EXISTS "hourly_market_stats_unique_key";

ALTER TABLE "public"."hourly_market_stats"
ADD CONSTRAINT "hourly_market_stats_unique_key"
UNIQUE ("stat_hour", "origin_country", "dest_country", "body_group", "source");

-- route_stats
ALTER TABLE "public"."route_stats"
DROP CONSTRAINT IF EXISTS "route_stats_unique_group";

ALTER TABLE "public"."route_stats"
ADD CONSTRAINT "route_stats_unique_group"
UNIQUE ("origin_country", "dest_country", "body_group", "source");


-- 3. Update Trigger Functions to handle dual-write (Source + ALL)

-- update_daily_stats_detailed
CREATE OR REPLACE FUNCTION "public"."update_daily_stats_detailed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _rate NUMERIC;
    _target_codes TEXT[];
    _code TEXT;
    _date DATE;
    _origin_code TEXT;
    _dest_code TEXT;
    _sources TEXT[];
    _src TEXT;
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        _date := DATE(NEW.created_at);
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);

        -- Prepare sources: specific source AND 'ALL'
        _sources := ARRAY[COALESCE(NEW.source, 'UNKNOWN'), 'ALL'];

        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _src IN ARRAY _sources
            LOOP
                FOREACH _code IN ARRAY _target_codes
                LOOP
                    INSERT INTO daily_market_stats (
                        stat_date, origin_country, dest_country, body_group, source,
                        total_price_amount, total_distance_km, offer_count,
                        min_rate_per_km, max_rate_per_km, last_updated
                    )
                    VALUES (
                        _date,
                        _origin_code, 
                        _dest_code, 
                        _code,
                        _src,
                        NEW.price_amount,
                        NEW.distance_km,
                        1,
                        _rate, _rate,
                        NOW()
                    )
                    ON CONFLICT (stat_date, origin_country, dest_country, body_group, source)
                    DO UPDATE SET
                        total_price_amount = daily_market_stats.total_price_amount + EXCLUDED.total_price_amount,
                        total_distance_km = daily_market_stats.total_distance_km + EXCLUDED.total_distance_km,
                        offer_count = daily_market_stats.offer_count + 1,
                        min_rate_per_km = LEAST(daily_market_stats.min_rate_per_km, EXCLUDED.min_rate_per_km),
                        max_rate_per_km = GREATEST(daily_market_stats.max_rate_per_km, EXCLUDED.max_rate_per_km),
                        last_updated = NOW();
                END LOOP;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- update_hourly_stats_detailed
CREATE OR REPLACE FUNCTION "public"."update_hourly_stats_detailed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _rate NUMERIC;
    _target_codes TEXT[];
    _code TEXT;
    _hour TIMESTAMP WITH TIME ZONE;
    _origin_code TEXT;
    _dest_code TEXT;
    _sources TEXT[];
    _src TEXT;
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        _hour := date_trunc('hour', NEW.created_at);
        
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);

        -- Prepare sources
        _sources := ARRAY[COALESCE(NEW.source, 'UNKNOWN'), 'ALL'];

        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _src IN ARRAY _sources
            LOOP
                FOREACH _code IN ARRAY _target_codes
                LOOP
                    INSERT INTO hourly_market_stats (
                        stat_hour, origin_country, dest_country, body_group, source,
                        total_price_amount, total_distance_km, offer_count,
                        min_rate_per_km, max_rate_per_km, last_updated
                    )
                    VALUES (
                        _hour,
                        _origin_code, 
                        _dest_code, 
                        _code,
                        _src,
                        NEW.price_amount,
                        NEW.distance_km,
                        1,
                        _rate, _rate,
                        NOW()
                    )
                    ON CONFLICT (stat_hour, origin_country, dest_country, body_group, source)
                    DO UPDATE SET
                        total_price_amount = hourly_market_stats.total_price_amount + EXCLUDED.total_price_amount,
                        total_distance_km = hourly_market_stats.total_distance_km + EXCLUDED.total_distance_km,
                        offer_count = hourly_market_stats.offer_count + 1,
                        min_rate_per_km = LEAST(hourly_market_stats.min_rate_per_km, EXCLUDED.min_rate_per_km),
                        max_rate_per_km = GREATEST(hourly_market_stats.max_rate_per_km, EXCLUDED.max_rate_per_km),
                        last_updated = NOW();
                END LOOP;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- update_route_stats_detailed
CREATE OR REPLACE FUNCTION "public"."update_route_stats_detailed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _rate NUMERIC;
    _alpha NUMERIC := 0.1; 
    _target_codes TEXT[];
    _code TEXT;
    _origin_code TEXT;
    _dest_code TEXT;
    _sources TEXT[];
    _src TEXT;
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);
        
        -- Prepare sources
        _sources := ARRAY[COALESCE(NEW.source, 'UNKNOWN'), 'ALL'];

        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _src IN ARRAY _sources
            LOOP
                FOREACH _code IN ARRAY _target_codes
                LOOP
                    INSERT INTO route_stats (origin_country, dest_country, body_group, source, avg_rate_per_km, ema_rate_per_km, offers_count, last_updated)
                    VALUES (
                        _origin_code, 
                        _dest_code, 
                        _code,
                        _src,
                        _rate, _rate, 1, NOW()
                    )
                    ON CONFLICT (origin_country, dest_country, body_group, source)
                    DO UPDATE SET
                        ema_rate_per_km = route_stats.ema_rate_per_km + _alpha * (_rate - route_stats.ema_rate_per_km),
                        avg_rate_per_km = (route_stats.avg_rate_per_km * route_stats.offers_count + _rate) / (route_stats.offers_count + 1),
                        offers_count = route_stats.offers_count + 1,
                        last_updated = NOW();
                END LOOP;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Update Views to prevent double-counting (Filter for 'ALL' only by default)

CREATE OR REPLACE VIEW "public"."analytics_trend_7d" AS
 SELECT "origin_country",
    "dest_country",
    "body_group",
    ("sum"(
        CASE
            WHEN ("stat_date" = CURRENT_DATE) THEN "total_price_amount"
            ELSE (0)::numeric
        END) / NULLIF("sum"(
        CASE
            WHEN ("stat_date" = CURRENT_DATE) THEN "total_distance_km"
            ELSE (0)::numeric
        END), (0)::numeric)) AS "rate_today",
    ("sum"("total_price_amount") / NULLIF("sum"("total_distance_km"), (0)::numeric)) AS "rate_7d_avg",
    "sum"("offer_count") AS "volume_7d"
   FROM "public"."daily_market_stats"
  WHERE ("stat_date" >= (CURRENT_DATE - '7 days'::interval))
    AND "source" = 'ALL'
  GROUP BY "origin_country", "dest_country", "body_group"
 HAVING ("sum"("offer_count") > 5);

CREATE OR REPLACE VIEW "public"."live_market_snapshot" AS
 SELECT "origin_country",
    "dest_country",
    "body_group",
    "ema_rate_per_km" AS "live_rate",
    "offers_count" AS "volume",
    "last_updated" AS "last_seen"
   FROM "public"."route_stats"
  WHERE ("last_updated" > ("now"() - '48:00:00'::interval))
    AND "source" = 'ALL';

-- 5. Backfill Historical Data (TIMOCOM)
-- Copy existing 'ALL' rows (which are 100% Timocom historically) to 'TIMOCOM' rows
INSERT INTO daily_market_stats (stat_date, origin_country, dest_country, body_group, source, total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated)
SELECT stat_date, origin_country, dest_country, body_group, 'TIMOCOM', total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated
FROM daily_market_stats
WHERE source = 'ALL'
ON CONFLICT DO NOTHING;

INSERT INTO hourly_market_stats (stat_hour, origin_country, dest_country, body_group, source, total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated)
SELECT stat_hour, origin_country, dest_country, body_group, 'TIMOCOM', total_price_amount, total_distance_km, offer_count, min_rate_per_km, max_rate_per_km, last_updated
FROM hourly_market_stats
WHERE source = 'ALL'
ON CONFLICT DO NOTHING;

INSERT INTO route_stats (origin_country, dest_country, body_group, source, avg_rate_per_km, ema_rate_per_km, offers_count, last_updated)
SELECT origin_country, dest_country, body_group, 'TIMOCOM', avg_rate_per_km, ema_rate_per_km, offers_count, last_updated
FROM route_stats
WHERE source = 'ALL'
ON CONFLICT DO NOTHING;



