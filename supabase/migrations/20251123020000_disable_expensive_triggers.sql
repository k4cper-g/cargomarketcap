-- Disable expensive triggers that cause statement timeouts
-- These triggers were calling refresh_route_metrics() FOR EACH ROW,
-- which cascades into hundreds of expensive queries when batch inserts happen.
--
-- With route_stats_live and the 5-second cron job, these triggers are now redundant.
-- The cron job (refresh_route_stats_live) handles all metric updates efficiently in bulk.

-- Disable the hourly stats trigger
DROP TRIGGER IF EXISTS "on_hourly_stats_change" ON "public"."hourly_market_stats";

-- Disable the daily stats trigger
DROP TRIGGER IF EXISTS "on_daily_stats_change" ON "public"."daily_market_stats";

-- Note: We keep the refresh_route_metrics function in case it's needed for manual use,
-- but it's no longer called automatically on every row change.

-- Also add REPLICA IDENTITY FULL to route_stats_live for realtime
ALTER TABLE "public"."route_stats_live" REPLICA IDENTITY FULL;
