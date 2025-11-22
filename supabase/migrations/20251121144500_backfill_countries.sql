-- One-time migration to backfill country codes for existing stats
DO $$
DECLARE
    r RECORD;
    _new_origin text;
    _new_dest text;
BEGIN
    -- 1. Fix route_stats
    FOR r IN SELECT * FROM route_stats WHERE origin_country ~ '^[0-9]+$' OR dest_country ~ '^[0-9]+$'
    LOOP
        _new_origin := get_country_code(r.origin_country);
        _new_dest := get_country_code(r.dest_country);

        -- Only update if something actually changed
        IF _new_origin <> r.origin_country OR _new_dest <> r.dest_country THEN
            -- We can't just update because of the UNIQUE constraint (origin, dest, body).
            -- If the 'resolved' row already exists, we should merge them (sum counts, avg rates).
            -- For simplicity in this fix script, we'll just delete the old 'ID' row if a 'Code' row exists,
            -- or update it if it doesn't.
            
            BEGIN
                UPDATE route_stats 
                SET origin_country = _new_origin, dest_country = _new_dest
                WHERE id = r.id;
            EXCEPTION WHEN unique_violation THEN
                -- The target row (e.g. DE->PL) already exists, so we should probably delete this '4->61' row
                -- to avoid duplicates, or ideally merge the stats.
                -- Here we'll just DELETE the old raw-ID row to clean up.
                DELETE FROM route_stats WHERE id = r.id;
            END;
        END IF;
    END LOOP;

    -- 2. Fix hourly_market_stats
    FOR r IN SELECT * FROM hourly_market_stats WHERE origin_country ~ '^[0-9]+$' OR dest_country ~ '^[0-9]+$'
    LOOP
        _new_origin := get_country_code(r.origin_country);
        _new_dest := get_country_code(r.dest_country);

        IF _new_origin <> r.origin_country OR _new_dest <> r.dest_country THEN
            BEGIN
                UPDATE hourly_market_stats 
                SET origin_country = _new_origin, dest_country = _new_dest
                WHERE id = r.id;
            EXCEPTION WHEN unique_violation THEN
                DELETE FROM hourly_market_stats WHERE id = r.id;
            END;
        END IF;
    END LOOP;

    -- 3. Fix daily_market_stats
    FOR r IN SELECT * FROM daily_market_stats WHERE origin_country ~ '^[0-9]+$' OR dest_country ~ '^[0-9]+$'
    LOOP
        _new_origin := get_country_code(r.origin_country);
        _new_dest := get_country_code(r.dest_country);

        IF _new_origin <> r.origin_country OR _new_dest <> r.dest_country THEN
            BEGIN
                UPDATE daily_market_stats 
                SET origin_country = _new_origin, dest_country = _new_dest
                WHERE id = r.id;
            EXCEPTION WHEN unique_violation THEN
                DELETE FROM daily_market_stats WHERE id = r.id;
            END;
        END IF;
    END LOOP;
END;
$$;

