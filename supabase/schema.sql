


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_data"("days_to_keep" integer DEFAULT 30) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM raw_offers 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_data"("days_to_keep" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_country_code"("input_val" "text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    resolved_code text;
BEGIN
    -- If input is numeric, try to look it up in dictionaries
    IF input_val ~ '^[0-9]+$' THEN
        SELECT code INTO resolved_code
        FROM dictionaries
        WHERE type = 'country' AND external_id = input_val::int
        LIMIT 1;
    END IF;

    -- Return resolved code, or original input (if text/not found), or 'UNKNOWN'
    RETURN COALESCE(resolved_code, input_val, 'UNKNOWN');
END;
$_$;


ALTER FUNCTION "public"."get_country_code"("input_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_offer_codes"("vehicle_ids" "jsonb") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    codes TEXT[];
BEGIN
    -- Pobieramy 'code' ze słownika na podstawie ID
    SELECT ARRAY_AGG(DISTINCT code)
    INTO codes
    FROM dictionaries
    WHERE type = 'body_type' 
      AND external_id = ANY(
          SELECT jsonb_array_elements_text(vehicle_ids)::int
      );
      
    -- Jak nie ma w słowniku, to UNKNOWN
    IF codes IS NULL OR array_length(codes, 1) IS NULL THEN
        codes := ARRAY['UNKNOWN'];
    END IF;

    -- ZAWSZE dodaj grupę 'ALL' (dla ogólnego benchmarku trasy)
    codes := array_append(codes, 'ALL');

    RETURN codes;
END;
$$;


ALTER FUNCTION "public"."get_offer_codes"("vehicle_ids" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_route_metrics"("_origin" "text", "_dest" "text", "_group" "text", "_source" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."refresh_route_metrics"("_origin" "text", "_dest" "text", "_group" "text", "_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_metrics_daily"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM refresh_route_metrics(NEW.origin_country, NEW.dest_country, NEW.body_group, NEW.source);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_metrics_daily"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_metrics_hourly"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM refresh_route_metrics(NEW.origin_country, NEW.dest_country, NEW.body_group, NEW.source);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_metrics_hourly"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_daily_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _rate NUMERIC;
    _group TEXT;
    _date DATE;
BEGIN
    -- Walidacja danych
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        _group := COALESCE(NEW.body_group, 'GENERAL');
        _date := DATE(NEW.created_at); -- Grupujemy po dacie utworzenia oferty
        
        -- Filtr Sanity (0.2 - 10.0 EUR/km)
        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            
            INSERT INTO daily_market_stats (
                stat_date, origin_country, dest_country, body_group,
                total_price_amount, total_distance_km, offer_count,
                min_rate_per_km, max_rate_per_km, last_updated
            )
            VALUES (
                _date,
                COALESCE(NEW.origin_country, 'UNKNOWN'), 
                COALESCE(NEW.dest_country, 'UNKNOWN'), 
                _group,
                NEW.price_amount,
                NEW.distance_km,
                1,
                _rate, -- min
                _rate, -- max
                NOW()
            )
            ON CONFLICT (stat_date, origin_country, dest_country, body_group)
            DO UPDATE SET
                total_price_amount = daily_market_stats.total_price_amount + EXCLUDED.total_price_amount,
                total_distance_km = daily_market_stats.total_distance_km + EXCLUDED.total_distance_km,
                offer_count = daily_market_stats.offer_count + 1,
                -- Aktualizacja Min/Max tylko jeśli nowa wartość jest mniejsza/większa
                min_rate_per_km = LEAST(daily_market_stats.min_rate_per_km, EXCLUDED.min_rate_per_km),
                max_rate_per_km = GREATEST(daily_market_stats.max_rate_per_km, EXCLUDED.max_rate_per_km),
                last_updated = NOW();
                
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_daily_stats"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."update_daily_stats_detailed"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."update_hourly_stats_detailed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_route_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- ... (reszta kodu) ...
    -- Zamiast brać NULL, używamy naszej funkcji klasyfikującej:
    NEW.body_group := classify_body_group(NEW.vehicle_body_ids);
    -- ...
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_route_stats"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."update_route_stats_detailed"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."daily_market_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stat_date" "date" NOT NULL,
    "origin_country" "text" NOT NULL,
    "dest_country" "text" NOT NULL,
    "body_group" "text" DEFAULT 'GENERAL'::"text" NOT NULL,
    "total_price_amount" numeric DEFAULT 0,
    "total_distance_km" numeric DEFAULT 0,
    "offer_count" integer DEFAULT 0,
    "min_rate_per_km" numeric DEFAULT 999,
    "max_rate_per_km" numeric DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "source" "text" DEFAULT 'ALL'::"text" NOT NULL
);


ALTER TABLE "public"."daily_market_stats" OWNER TO "postgres";


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
  WHERE (("stat_date" >= (CURRENT_DATE - '7 days'::interval)) AND ("source" = 'ALL'::"text"))
  GROUP BY "origin_country", "dest_country", "body_group"
 HAVING ("sum"("offer_count") > 5);


ALTER VIEW "public"."analytics_trend_7d" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dictionaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "external_id" integer NOT NULL,
    "code" "text",
    "label" "text",
    "payload" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dictionaries" OWNER TO "postgres";


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
CASE
    WHEN ("total_distance_km" > (0)::numeric) THEN ("total_price_amount" / "total_distance_km")
    ELSE (0)::numeric
END) STORED,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "source" "text" DEFAULT 'ALL'::"text" NOT NULL
);


ALTER TABLE "public"."hourly_market_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "origin_country" "text" NOT NULL,
    "dest_country" "text" NOT NULL,
    "avg_rate_per_km" numeric DEFAULT 0,
    "ema_rate_per_km" numeric DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "offers_count" integer DEFAULT 0,
    "body_group" "text" DEFAULT 'GENERAL'::"text",
    "source" "text" DEFAULT 'ALL'::"text" NOT NULL,
    "volume_24h" numeric DEFAULT 0,
    "market_cap" numeric DEFAULT 0
);


ALTER TABLE "public"."route_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."live_market_snapshot" AS
 SELECT "origin_country",
    "dest_country",
    "body_group",
    "ema_rate_per_km" AS "live_rate",
    "offers_count" AS "volume",
    "last_updated" AS "last_seen"
   FROM "public"."route_stats"
  WHERE (("last_updated" > ("now"() - '48:00:00'::interval)) AND ("source" = 'ALL'::"text"));


ALTER VIEW "public"."live_market_snapshot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."raw_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price_amount" numeric,
    "currency_id" integer,
    "distance_km" numeric,
    "origin_country" "text",
    "origin_zip" "text",
    "dest_country" "text",
    "dest_zip" "text",
    "vehicle_body_ids" "jsonb",
    "full_payload" "jsonb",
    "source" "text" DEFAULT 'UNKNOWN'::"text"
);


ALTER TABLE "public"."raw_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."watchlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "origin_country" "text" NOT NULL,
    "dest_country" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."watchlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."daily_market_stats"
    ADD CONSTRAINT "daily_market_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_market_stats"
    ADD CONSTRAINT "daily_market_stats_unique_key" UNIQUE ("stat_date", "origin_country", "dest_country", "body_group", "source");



ALTER TABLE ONLY "public"."dictionaries"
    ADD CONSTRAINT "dictionaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictionaries"
    ADD CONSTRAINT "dictionaries_type_external_id_key" UNIQUE ("type", "external_id");



ALTER TABLE ONLY "public"."hourly_market_stats"
    ADD CONSTRAINT "hourly_market_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hourly_market_stats"
    ADD CONSTRAINT "hourly_market_stats_unique_key" UNIQUE ("stat_hour", "origin_country", "dest_country", "body_group", "source");



ALTER TABLE ONLY "public"."raw_offers"
    ADD CONSTRAINT "raw_offers_original_id_key" UNIQUE ("original_id");



ALTER TABLE ONLY "public"."raw_offers"
    ADD CONSTRAINT "raw_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_stats"
    ADD CONSTRAINT "route_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_stats"
    ADD CONSTRAINT "route_stats_unique_group" UNIQUE ("origin_country", "dest_country", "body_group", "source");



ALTER TABLE ONLY "public"."watchlist"
    ADD CONSTRAINT "watchlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."watchlist"
    ADD CONSTRAINT "watchlist_user_id_origin_country_dest_country_key" UNIQUE ("user_id", "origin_country", "dest_country");



CREATE INDEX "idx_hourly_stats_lookup" ON "public"."hourly_market_stats" USING "btree" ("origin_country", "dest_country", "body_group", "source", "stat_hour" DESC);



CREATE INDEX "idx_raw_offers_created_at" ON "public"."raw_offers" USING "btree" ("created_at");



CREATE OR REPLACE TRIGGER "on_new_offer" AFTER INSERT ON "public"."raw_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_route_stats_detailed"();



CREATE OR REPLACE TRIGGER "on_offer_insert_daily" AFTER INSERT ON "public"."raw_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_stats_detailed"();



CREATE OR REPLACE TRIGGER "on_offer_insert_hourly" AFTER INSERT ON "public"."raw_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_hourly_stats_detailed"();



ALTER TABLE ONLY "public"."watchlist"
    ADD CONSTRAINT "watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow read daily stats" ON "public"."daily_market_stats" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow read hourly stats" ON "public"."hourly_market_stats" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow read hourly stats auth" ON "public"."hourly_market_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable all for anon" ON "public"."dictionaries" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for anon" ON "public"."raw_offers" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for anon" ON "public"."route_stats" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete from their own watchlist" ON "public"."watchlist" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert into their own watchlist" ON "public"."watchlist" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own watchlist" ON "public"."watchlist" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."daily_market_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hourly_market_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."route_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."watchlist" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_data"("days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"("days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"("days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_offer_codes"("vehicle_ids" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_offer_codes"("vehicle_ids" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_offer_codes"("vehicle_ids" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_route_metrics"("_origin" "text", "_dest" "text", "_group" "text", "_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_route_metrics"("_origin" "text", "_dest" "text", "_group" "text", "_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_route_metrics"("_origin" "text", "_dest" "text", "_group" "text", "_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_daily"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_daily"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_daily"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_hourly"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_hourly"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_metrics_hourly"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_daily_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_daily_stats_detailed"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_stats_detailed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_stats_detailed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_hourly_stats_detailed"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_hourly_stats_detailed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_hourly_stats_detailed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_route_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_route_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_route_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_route_stats_detailed"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_route_stats_detailed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_route_stats_detailed"() TO "service_role";



GRANT ALL ON TABLE "public"."daily_market_stats" TO "anon";
GRANT ALL ON TABLE "public"."daily_market_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_market_stats" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_trend_7d" TO "anon";
GRANT ALL ON TABLE "public"."analytics_trend_7d" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_trend_7d" TO "service_role";



GRANT ALL ON TABLE "public"."dictionaries" TO "anon";
GRANT ALL ON TABLE "public"."dictionaries" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionaries" TO "service_role";



GRANT ALL ON TABLE "public"."hourly_market_stats" TO "anon";
GRANT ALL ON TABLE "public"."hourly_market_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."hourly_market_stats" TO "service_role";



GRANT ALL ON TABLE "public"."route_stats" TO "anon";
GRANT ALL ON TABLE "public"."route_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."route_stats" TO "service_role";



GRANT ALL ON TABLE "public"."live_market_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."live_market_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."live_market_snapshot" TO "service_role";



GRANT ALL ON TABLE "public"."raw_offers" TO "anon";
GRANT ALL ON TABLE "public"."raw_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_offers" TO "service_role";



GRANT ALL ON TABLE "public"."watchlist" TO "anon";
GRANT ALL ON TABLE "public"."watchlist" TO "authenticated";
GRANT ALL ON TABLE "public"."watchlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







