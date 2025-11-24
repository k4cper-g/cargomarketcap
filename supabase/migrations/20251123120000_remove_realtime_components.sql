-- Migration: Remove realtime components
-- This migration removes the route_stats_live table and refresh function
-- that were used for real-time updates. The web app now computes change
-- values client-side from hourly_market_stats.

-- Drop policies first
DROP POLICY IF EXISTS "Allow read access" ON "public"."route_stats_live";

-- Drop indexes
DROP INDEX IF EXISTS "public"."idx_route_stats_live_body_group";
DROP INDEX IF EXISTS "public"."idx_route_stats_live_offers";
DROP INDEX IF EXISTS "public"."idx_route_stats_live_source";

-- Drop the function (this also removes any dependencies)
DROP FUNCTION IF EXISTS "public"."refresh_route_stats_live"();

-- Drop the table
DROP TABLE IF EXISTS "public"."route_stats_live";
