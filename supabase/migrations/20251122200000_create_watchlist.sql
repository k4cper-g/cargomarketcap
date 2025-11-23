-- Create watchlist table for user favorites
CREATE TABLE IF NOT EXISTS "public"."watchlist" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "origin_country" text NOT NULL,
    "dest_country" text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    UNIQUE("user_id", "origin_country", "dest_country")
);

-- Enable RLS
ALTER TABLE "public"."watchlist" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlist items
CREATE POLICY "Users can view own watchlist" ON "public"."watchlist"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own watchlist items
CREATE POLICY "Users can insert own watchlist" ON "public"."watchlist"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own watchlist items
CREATE POLICY "Users can delete own watchlist" ON "public"."watchlist"
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "watchlist_user_id_idx" ON "public"."watchlist"("user_id");
CREATE INDEX IF NOT EXISTS "watchlist_route_idx" ON "public"."watchlist"("origin_country", "dest_country");
