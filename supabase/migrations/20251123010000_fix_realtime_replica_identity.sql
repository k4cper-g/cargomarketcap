-- Fix: Enable REPLICA IDENTITY FULL for route_stats_live
-- This is required for Supabase Realtime to broadcast UPDATE events with full row data
-- Without this, the realtime subscription won't receive UPDATE payloads

ALTER TABLE "public"."route_stats_live" REPLICA IDENTITY FULL;

-- Also verify the table is in the publication (idempotent)
DO $$
BEGIN
    -- Check if table is already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'route_stats_live'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE route_stats_live;
    END IF;
END $$;
