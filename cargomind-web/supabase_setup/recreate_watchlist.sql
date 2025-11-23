-- Recreate the watchlist table with better defaults to fix RLS issues
drop table if exists public.watchlist;

create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  -- Automatically set user_id to the authenticated user's ID
  user_id uuid references auth.users(id) default auth.uid() not null,
  origin_country text not null,
  dest_country text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate entries for the same route per user
  unique(user_id, origin_country, dest_country)
);

-- Enable Row Level Security (RLS)
alter table public.watchlist enable row level security;

-- Create policies
create policy "Users can view their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- Grant access to authenticated users
grant select, insert, delete on public.watchlist to authenticated;
