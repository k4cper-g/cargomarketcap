-- 1. Add columns for cached metrics to enable efficient filtering/sorting
ALTER TABLE "public"."route_stats"
ADD COLUMN IF NOT EXISTS "volume_24h" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "market_cap" numeric DEFAULT 0;

-- 2. Initial Population of Data
-- This uses the existing daily/hourly stats to calculate initial values
-- Market Cap = 7-day Volume * 52 (Annualized run rate based on last week)
-- Volume 24h = Sum of last 24h from hourly stats

WITH metrics AS (
    SELECT 
        rs.id as route_id,
        -- Calculate Volume 24h
        COALESCE((
            SELECT SUM(h.total_price_amount)
            FROM hourly_market_stats h
            WHERE h.origin_country = rs.origin_country
              AND h.dest_country = rs.dest_country
              AND h.body_group = rs.body_group
              AND h.source = rs.source
              AND h.stat_hour > (NOW() - INTERVAL '24 hours')
        ), 0) as vol_24h,
        -- Calculate Market Cap (7d volume * 52)
        COALESCE((
            SELECT SUM(d.total_price_amount)
            FROM daily_market_stats d
            WHERE d.origin_country = rs.origin_country
              AND d.dest_country = rs.dest_country
              AND d.body_group = rs.body_group
              AND d.source = rs.source
              AND d.stat_date >= (CURRENT_DATE - INTERVAL '7 days')
        ), 0) * 52 as mcap
    FROM route_stats rs
)
UPDATE route_stats
SET 
    volume_24h = metrics.vol_24h,
    market_cap = metrics.mcap
FROM metrics
WHERE route_stats.id = metrics.route_id;

-- 3. Function to refresh metrics for a specific route
-- This can be called by triggers or periodically
CREATE OR REPLACE FUNCTION "public"."refresh_route_metrics"(_origin text, _dest text, _group text, _source text) 
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _vol_24h numeric;
    _vol_7d numeric;
BEGIN
    -- Calculate 24h Volume
    SELECT COALESCE(SUM(total_price_amount), 0)
    INTO _vol_24h
    FROM hourly_market_stats
    WHERE origin_country = _origin
      AND dest_country = _dest
      AND body_group = _group
      AND source = _source
      AND stat_hour > (NOW() - INTERVAL '24 hours');

    -- Calculate 7d Volume for Market Cap
    SELECT COALESCE(SUM(total_price_amount), 0)
    INTO _vol_7d
    FROM daily_market_stats
    WHERE origin_country = _origin
      AND dest_country = _dest
      AND body_group = _group
      AND source = _source
      AND stat_date >= (CURRENT_DATE - INTERVAL '7 days');

    -- Update Route Stats
    UPDATE route_stats
    SET 
        volume_24h = _vol_24h,
        market_cap = _vol_7d * 52,
        last_updated = NOW()
    WHERE origin_country = _origin
      AND dest_country = _dest
      AND body_group = _group
      AND source = _source;
END;
$$;

-- 4. Trigger to update route metrics when Daily Stats change
-- We hook into daily stats because market cap changes daily.
-- For 24h volume, it changes hourly, so we should hook into hourly too ideally,
-- but daily is a good compromise for performance vs freshness for filtering.
CREATE OR REPLACE FUNCTION "public"."trigger_refresh_metrics_daily"() 
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM refresh_route_metrics(NEW.origin_country, NEW.dest_country, NEW.body_group, NEW.source);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "on_daily_stats_change"
AFTER INSERT OR UPDATE ON "public"."daily_market_stats"
FOR EACH ROW
EXECUTE FUNCTION "public"."trigger_refresh_metrics_daily"();

-- 5. Trigger for Hourly updates (for Volume 24h accuracy)
CREATE OR REPLACE FUNCTION "public"."trigger_refresh_metrics_hourly"() 
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM refresh_route_metrics(NEW.origin_country, NEW.dest_country, NEW.body_group, NEW.source);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "on_hourly_stats_change"
AFTER INSERT OR UPDATE ON "public"."hourly_market_stats"
FOR EACH ROW
EXECUTE FUNCTION "public"."trigger_refresh_metrics_hourly"();




