-- Add source column to raw_offers
ALTER TABLE "public"."raw_offers" 
ADD COLUMN IF NOT EXISTS "source" "text" DEFAULT 'UNKNOWN'::"text";

-- Backfill existing data to 'TIMOCOM'
-- Since we just added the column with default 'UNKNOWN', all existing rows have 'UNKNOWN'
UPDATE "public"."raw_offers" 
SET "source" = 'TIMOCOM' 
WHERE "source" = 'UNKNOWN';


