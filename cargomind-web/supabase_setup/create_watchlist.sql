-- Create the watchlist table
create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  origin_country text not null,
  dest_country text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate entries for the same route per user
  unique(user_id, origin_country, dest_country)
);

-- Enable Row Level Security (RLS)
alter table public.watchlist enable row level security;

-- Create policies
-- 1. Users can view their own watchlist
create policy "Users can view their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

-- 2. Users can insert into their own watchlist
create policy "Users can insert into their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

-- 3. Users can delete from their own watchlist
create policy "Users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- Grant access to authenticated users
grant select, insert, delete on public.watchlist to authenticated;
