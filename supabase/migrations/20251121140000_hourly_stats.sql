-- Create hourly_market_stats table
CREATE TABLE IF NOT EXISTS "public"."hourly_market_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stat_hour" timestamp with time zone NOT NULL,
    "origin_country" "text" NOT NULL,
    "dest_country" "text" NOT NULL,
    "body_group" "text" DEFAULT 'GENERAL'::"text" NOT NULL,
    "total_price_amount" numeric DEFAULT 0,
    "total_distance_km" numeric DEFAULT 0,
    "offer_count" integer DEFAULT 0,
    "min_rate_per_km" numeric DEFAULT 999,
    "max_rate_per_km" numeric DEFAULT 0,
    "avg_rate_per_km" numeric GENERATED ALWAYS AS (
        CASE WHEN total_distance_km > 0 THEN total_price_amount / total_distance_km ELSE 0 END
    ) STORED,
    "last_updated" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."hourly_market_stats" OWNER TO "postgres";

ALTER TABLE ONLY "public"."hourly_market_stats"
    ADD CONSTRAINT "hourly_market_stats_pkey" PRIMARY KEY ("id");

-- Unique constraint for upserts (bucketed by hour)
ALTER TABLE ONLY "public"."hourly_market_stats"
    ADD CONSTRAINT "hourly_market_stats_unique_key" UNIQUE ("stat_hour", "origin_country", "dest_country", "body_group");

-- Enable RLS
ALTER TABLE "public"."hourly_market_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read hourly stats" ON "public"."hourly_market_stats" FOR SELECT TO "anon" USING (true);
CREATE POLICY "Allow read hourly stats auth" ON "public"."hourly_market_stats" FOR SELECT TO "authenticated" USING (true);
GRANT ALL ON TABLE "public"."hourly_market_stats" TO "anon";
GRANT ALL ON TABLE "public"."hourly_market_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."hourly_market_stats" TO "service_role";

-- Trigger Function to update hourly stats
CREATE OR REPLACE FUNCTION "public"."update_hourly_stats_detailed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _rate NUMERIC;
    _target_codes TEXT[];
    _code TEXT;
    _hour TIMESTAMP WITH TIME ZONE;
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        -- Truncate timestamp to the start of the hour
        _hour := date_trunc('hour', NEW.created_at);
        
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);

        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _code IN ARRAY _target_codes
            LOOP
                INSERT INTO hourly_market_stats (
                    stat_hour, origin_country, dest_country, body_group,
                    total_price_amount, total_distance_km, offer_count,
                    min_rate_per_km, max_rate_per_km, last_updated
                )
                VALUES (
                    _hour,
                    COALESCE(NEW.origin_country, 'UNKNOWN'), 
                    COALESCE(NEW.dest_country, 'UNKNOWN'), 
                    _code,
                    NEW.price_amount,
                    NEW.distance_km,
                    1,
                    _rate, _rate,
                    NOW()
                )
                ON CONFLICT (stat_hour, origin_country, dest_country, body_group)
                DO UPDATE SET
                    total_price_amount = hourly_market_stats.total_price_amount + EXCLUDED.total_price_amount,
                    total_distance_km = hourly_market_stats.total_distance_km + EXCLUDED.total_distance_km,
                    offer_count = hourly_market_stats.offer_count + 1,
                    min_rate_per_km = LEAST(hourly_market_stats.min_rate_per_km, EXCLUDED.min_rate_per_km),
                    max_rate_per_km = GREATEST(hourly_market_stats.max_rate_per_km, EXCLUDED.max_rate_per_km),
                    last_updated = NOW();
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_hourly_stats_detailed"() OWNER TO "postgres";

-- Attach Trigger to raw_offers
CREATE TRIGGER "on_offer_insert_hourly" AFTER INSERT ON "public"."raw_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_hourly_stats_detailed"();
