import { supabase } from '@/lib/supabaseClient';
import DashboardClient from './dashboard-client';
import { enrichRouteData } from '@/lib/market-utils';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const itemsPerPage = 50;
  const page = 1;

  // 1. Routes (Initial Page)
  const { data: routes, count } = await supabase
    .from('route_stats')
    .select('*', { count: 'exact' })
    .eq('body_group', 'ALL')
    .eq('source', 'ALL')
    .order('offers_count', { ascending: false })
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

  // 2. Hourly Stats (For Sparklines & 1h Change)
  const { data: hourlyChanges } = await supabase
    .from('hourly_market_stats')
    .select('origin_country, dest_country, body_group, stat_hour, avg_rate_per_km, source')
    .eq('body_group', 'ALL')
    .eq('source', 'ALL')
    .gt('stat_hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('stat_hour', { ascending: true });

  // 3. Daily Stats (For 24h/7d Change & Market Cap)
  const { data: dailyStats } = await supabase
      .from('daily_market_stats')
      .select('origin_country, dest_country, body_group, stat_date, total_price_amount, total_distance_km, offer_count, source')
      .eq('body_group', 'ALL')
      .eq('source', 'ALL')
      .gte('stat_date', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
      .order('stat_date', { ascending: false });

  // Calculate Global Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let totalVol7d = 0;
  let totalVol24h = 0;
  const countryCounts: Record<string, number> = {};

  if (dailyStats) {
      dailyStats.forEach((d: any) => {
        const vol = Number(d.total_price_amount) || 0;
        totalVol7d += vol;
        if (d.stat_date === todayStr || d.stat_date === yesterdayStr) {
            totalVol24h += vol;
        }
        countryCounts[d.origin_country] = (countryCounts[d.origin_country] || 0) + d.offer_count;
        countryCounts[d.dest_country] = (countryCounts[d.dest_country] || 0) + d.offer_count;
      });
  }

  const sortedCountries = Object.entries(countryCounts).sort(([,a], [,b]) => b - a).slice(0, 2);
  const totalActivity = Object.values(countryCounts).reduce((a, b) => a + b, 0);
  const dominanceStr = sortedCountries.length > 0 
    ? sortedCountries.map(([code, count]) => `${code} ${((count / totalActivity) * 100).toFixed(1)}%`).join(' ')
    : "N/A";

  const initialGlobalStats = { 
    marketVol7d: totalVol7d, 
    vol24h: totalVol24h, 
    dominance: dominanceStr 
  };

  // Enrich Initial Data
  const initialData = enrichRouteData(routes || [], hourlyChanges || [], dailyStats || []);

  return (
    <DashboardClient 
      initialData={initialData} 
      initialGlobalStats={initialGlobalStats} 
      initialTotalCount={count || 0} 
    />
  );
}
