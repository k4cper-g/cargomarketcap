begin;
  -- Enable realtime for route_stats table
  alter publication supabase_realtime add table route_stats;
commit;

