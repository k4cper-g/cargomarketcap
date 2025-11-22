-- Function to resolve country code from dictionary or fallback to raw value
CREATE OR REPLACE FUNCTION "public"."get_country_code"("input_val" text) RETURNS text
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;

ALTER FUNCTION "public"."get_country_code"("input_val" text) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_country_code"("input_val" text) TO "service_role";


-- Update hourly stats trigger function to use get_country_code
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
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        _hour := date_trunc('hour', NEW.created_at);
        
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);

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
                    _origin_code, 
                    _dest_code, 
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


-- Update daily stats trigger function to use get_country_code
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
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        _date := DATE(NEW.created_at);
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);

        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _code IN ARRAY _target_codes
            LOOP
                INSERT INTO daily_market_stats (
                    stat_date, origin_country, dest_country, body_group,
                    total_price_amount, total_distance_km, offer_count,
                    min_rate_per_km, max_rate_per_km, last_updated
                )
                VALUES (
                    _date,
                    _origin_code, 
                    _dest_code, 
                    _code,
                    NEW.price_amount,
                    NEW.distance_km,
                    1,
                    _rate, _rate,
                    NOW()
                )
                ON CONFLICT (stat_date, origin_country, dest_country, body_group)
                DO UPDATE SET
                    total_price_amount = daily_market_stats.total_price_amount + EXCLUDED.total_price_amount,
                    total_distance_km = daily_market_stats.total_distance_km + EXCLUDED.total_distance_km,
                    offer_count = daily_market_stats.offer_count + 1,
                    min_rate_per_km = LEAST(daily_market_stats.min_rate_per_km, EXCLUDED.min_rate_per_km),
                    max_rate_per_km = GREATEST(daily_market_stats.max_rate_per_km, EXCLUDED.max_rate_per_km),
                    last_updated = NOW();
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


-- Update route stats trigger function to use get_country_code
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
BEGIN
    IF NEW.distance_km > 0 AND NEW.price_amount > 0 THEN
        _rate := NEW.price_amount / NEW.distance_km;
        
        _target_codes := get_offer_codes(NEW.vehicle_body_ids);
        
        -- Resolve country codes
        _origin_code := get_country_code(NEW.origin_country);
        _dest_code := get_country_code(NEW.dest_country);
        
        IF _rate >= 0.2 AND _rate <= 10.0 THEN
            FOREACH _code IN ARRAY _target_codes
            LOOP
                INSERT INTO route_stats (origin_country, dest_country, body_group, avg_rate_per_km, ema_rate_per_km, offers_count, last_updated)
                VALUES (
                    _origin_code, 
                    _dest_code, 
                    _code,
                    _rate, _rate, 1, NOW()
                )
                ON CONFLICT (origin_country, dest_country, body_group)
                DO UPDATE SET
                    ema_rate_per_km = route_stats.ema_rate_per_km + _alpha * (_rate - route_stats.ema_rate_per_km),
                    avg_rate_per_km = (route_stats.avg_rate_per_km * route_stats.offers_count + _rate) / (route_stats.offers_count + 1),
                    offers_count = route_stats.offers_count + 1,
                    last_updated = NOW();
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

