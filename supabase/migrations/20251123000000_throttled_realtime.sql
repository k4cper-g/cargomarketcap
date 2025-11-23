-- Migration: Throttled Realtime with Server-Side Computed Fields
-- This creates a separate broadcast table that updates every 5 seconds
-- instead of on every row change, preventing UI flickering

-- 1. Create the live broadcast table with ALL computed fields
CREATE TABLE IF NOT EXISTS "public"."route_stats_live" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "origin_country" text NOT NULL,
    "dest_country" text NOT NULL,
    "body_group" text DEFAULT 'ALL',
    "source" text DEFAULT 'ALL',
    "avg_rate_per_km" numeric DEFAULT 0,
    "ema_rate_per_km" numeric DEFAULT 0,
    "offers_count" integer DEFAULT 0,
    "change_1h" numeric DEFAULT 0,
    "change_24h" numeric DEFAULT 0,
    "change_7d" numeric DEFAULT 0,
    "volume_24h" numeric DEFAULT 0,
    "market_cap" numeric DEFAULT 0,
    "last_updated" timestamptz DEFAULT now(),
    UNIQUE (origin_country, dest_country, body_group, source)
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_route_stats_live_source ON route_stats_live(source);
CREATE INDEX IF NOT EXISTS idx_route_stats_live_body_group ON route_stats_live(body_group);
CREATE INDEX IF NOT EXISTS idx_route_stats_live_offers ON route_stats_live(offers_count DESC);

-- 3. Enable RLS
ALTER TABLE "public"."route_stats_live" ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users
CREATE POLICY "Allow read access" ON "public"."route_stats_live"
FOR SELECT TO anon, authenticated USING (true);

-- 4. Move realtime from route_stats to route_stats_live
-- First remove from route_stats (may fail if not added, that's ok)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE route_stats;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if table wasn't in publication
    NULL;
END $$;

-- Add route_stats_live to realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE route_stats_live;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added
    NULL;
END $$;

-- 5. Create the refresh function that computes ALL fields server-side
CREATE OR REPLACE FUNCTION "public"."refresh_route_stats_live"()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    _updated_count integer := 0;
    _now timestamp := NOW();
    _today date := CURRENT_DATE;
    _yesterday date := CURRENT_DATE - INTERVAL '1 day';
    _last_week date := CURRENT_DATE - INTERVAL '7 days';
    _one_hour_ago timestamp := NOW() - INTERVAL '1 hour';
    _24h_ago timestamp := NOW() - INTERVAL '24 hours';
BEGIN
    -- Upsert all routes with computed metrics
    WITH computed_metrics AS (
        SELECT
            rs.origin_country,
            rs.dest_country,
            rs.body_group,
            rs.source,
            rs.avg_rate_per_km,
            rs.ema_rate_per_km,
            rs.offers_count,
            rs.last_updated as rs_last_updated,

            -- Change 1h: compare current rate vs hourly rate from ~1 hour ago
            COALESCE(
                CASE
                    WHEN h_1h.avg_rate_per_km > 0 THEN
                        ((rs.avg_rate_per_km - h_1h.avg_rate_per_km) / h_1h.avg_rate_per_km) * 100
                    ELSE 0
                END,
                0
            ) as change_1h,

            -- Change 24h: compare today's daily rate vs yesterday's
            COALESCE(
                CASE
                    WHEN d_yesterday.total_distance_km > 0 AND d_today.total_distance_km > 0 THEN
                        (((d_today.total_price_amount / d_today.total_distance_km) -
                          (d_yesterday.total_price_amount / d_yesterday.total_distance_km)) /
                         (d_yesterday.total_price_amount / d_yesterday.total_distance_km)) * 100
                    ELSE 0
                END,
                0
            ) as change_24h,

            -- Change 7d: compare today's daily rate vs 7 days ago
            COALESCE(
                CASE
                    WHEN d_7d.total_distance_km > 0 AND d_today.total_distance_km > 0 THEN
                        (((d_today.total_price_amount / d_today.total_distance_km) -
                          (d_7d.total_price_amount / d_7d.total_distance_km)) /
                         (d_7d.total_price_amount / d_7d.total_distance_km)) * 100
                    ELSE 0
                END,
                0
            ) as change_7d,

            -- Volume 24h from route_stats (already computed by triggers)
            COALESCE(rs.volume_24h, 0) as volume_24h,

            -- Market Cap from route_stats (already computed by triggers)
            COALESCE(rs.market_cap, 0) as market_cap

        FROM route_stats rs

        -- Join hourly stats for 1h change (get the oldest record within last hour)
        LEFT JOIN LATERAL (
            SELECT avg_rate_per_km
            FROM hourly_market_stats h
            WHERE h.origin_country = rs.origin_country
              AND h.dest_country = rs.dest_country
              AND h.body_group = rs.body_group
              AND h.source = rs.source
              AND h.stat_hour >= _one_hour_ago
            ORDER BY h.stat_hour ASC
            LIMIT 1
        ) h_1h ON true

        -- Join daily stats for today
        LEFT JOIN daily_market_stats d_today ON
            d_today.origin_country = rs.origin_country
            AND d_today.dest_country = rs.dest_country
            AND d_today.body_group = rs.body_group
            AND d_today.source = rs.source
            AND d_today.stat_date = _today

        -- Join daily stats for yesterday
        LEFT JOIN daily_market_stats d_yesterday ON
            d_yesterday.origin_country = rs.origin_country
            AND d_yesterday.dest_country = rs.dest_country
            AND d_yesterday.body_group = rs.body_group
            AND d_yesterday.source = rs.source
            AND d_yesterday.stat_date = _yesterday

        -- Join daily stats for 7 days ago
        LEFT JOIN daily_market_stats d_7d ON
            d_7d.origin_country = rs.origin_country
            AND d_7d.dest_country = rs.dest_country
            AND d_7d.body_group = rs.body_group
            AND d_7d.source = rs.source
            AND d_7d.stat_date = _last_week
    ),
    upserted AS (
        INSERT INTO route_stats_live (
            origin_country, dest_country, body_group, source,
            avg_rate_per_km, ema_rate_per_km, offers_count,
            change_1h, change_24h, change_7d,
            volume_24h, market_cap, last_updated
        )
        SELECT
            origin_country, dest_country, body_group, source,
            avg_rate_per_km, ema_rate_per_km, offers_count,
            change_1h, change_24h, change_7d,
            volume_24h, market_cap, _now
        FROM computed_metrics
        ON CONFLICT (origin_country, dest_country, body_group, source)
        DO UPDATE SET
            avg_rate_per_km = EXCLUDED.avg_rate_per_km,
            ema_rate_per_km = EXCLUDED.ema_rate_per_km,
            offers_count = EXCLUDED.offers_count,
            change_1h = EXCLUDED.change_1h,
            change_24h = EXCLUDED.change_24h,
            change_7d = EXCLUDED.change_7d,
            volume_24h = EXCLUDED.volume_24h,
            market_cap = EXCLUDED.market_cap,
            last_updated = EXCLUDED.last_updated
        -- Only update if something actually changed to minimize realtime broadcasts
        WHERE route_stats_live.avg_rate_per_km IS DISTINCT FROM EXCLUDED.avg_rate_per_km
           OR route_stats_live.offers_count IS DISTINCT FROM EXCLUDED.offers_count
           OR route_stats_live.change_1h IS DISTINCT FROM EXCLUDED.change_1h
           OR route_stats_live.change_24h IS DISTINCT FROM EXCLUDED.change_24h
           OR route_stats_live.change_7d IS DISTINCT FROM EXCLUDED.change_7d
           OR route_stats_live.volume_24h IS DISTINCT FROM EXCLUDED.volume_24h
           OR route_stats_live.market_cap IS DISTINCT FROM EXCLUDED.market_cap
        RETURNING 1
    )
    SELECT COUNT(*) INTO _updated_count FROM upserted;

    RETURN _updated_count;
END;
$$;

-- 6. Initial population - copy all existing routes
SELECT refresh_route_stats_live();

-- 7. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 8. Create the looping refresh function for sub-minute precision
-- Runs 12 times per minute (every 5 seconds)
CREATE OR REPLACE FUNCTION "public"."refresh_route_stats_live_loop"()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    i INTEGER;
    refresh_interval INTEGER := 5;  -- seconds between refreshes
    iterations INTEGER := 12;        -- 60/5 = 12 per minute
BEGIN
    FOR i IN 1..iterations LOOP
        PERFORM refresh_route_stats_live();
        IF i < iterations THEN
            PERFORM pg_sleep(refresh_interval);
        END IF;
    END LOOP;
END;
$$;

-- 9. Schedule the cron job to run every minute
-- The function internally loops 12 times with 5-second sleeps
SELECT cron.schedule(
    'refresh-route-stats-live',
    '* * * * *',
    $$SELECT refresh_route_stats_live_loop()$$
);

-- 10. Grant necessary permissions
GRANT SELECT ON route_stats_live TO anon;
GRANT SELECT ON route_stats_live TO authenticated;
