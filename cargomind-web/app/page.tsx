import { supabase } from '@/lib/supabaseClient';
import DashboardClient from './dashboard-client';
import { RouteStat } from '@/lib/market-utils';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const itemsPerPage = 50;
  const page = 1;

  // Fetch from route_stats_live - all fields are pre-computed server-side
  const { data: routes, count } = await supabase
    .from('route_stats_live')
    .select('*', { count: 'exact' })
    .eq('body_group', 'ALL')
    .eq('source', 'ALL')
    .order('offers_count', { ascending: false })
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

  // Fetch daily stats for global stats calculation
  const { data: dailyStats } = await supabase
      .from('daily_market_stats')
      .select('origin_country, dest_country, body_group, stat_date, total_price_amount, total_distance_km, offer_count, source')
      .eq('body_group', 'ALL')
      .eq('source', 'ALL')
      .gte('stat_date', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
      .order('stat_date', { ascending: false });

  // Fetch hourly stats for sparkline (last 24 hours)
  const { data: hourlyStats } = await supabase
      .from('hourly_market_stats')
      .select('origin_country, dest_country, body_group, source, stat_hour, avg_rate_per_km')
      .eq('body_group', 'ALL')
      .eq('source', 'ALL')
      .gte('stat_hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('stat_hour', { ascending: true });

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

  // Build sparkline lookup from hourly stats
  const sparklineLookup: Record<string, { value: number }[]> = {};
  if (hourlyStats) {
    hourlyStats.forEach((h: any) => {
      const key = `${h.origin_country}-${h.dest_country}`;
      if (!sparklineLookup[key]) {
        sparklineLookup[key] = [];
      }
      sparklineLookup[key].push({ value: h.avg_rate_per_km });
    });
  }

  // Data from route_stats_live already has all computed fields - add rank and sparkline
  const initialData: RouteStat[] = (routes || []).map((r: any, i: number) => {
    const key = `${r.origin_country}-${r.dest_country}`;
    return {
      ...r,
      rank: i + 1,
      sparkline: sparklineLookup[key] || []
    };
  });

  return (
    <DashboardClient
      initialData={initialData}
      initialGlobalStats={initialGlobalStats}
      initialTotalCount={count || 0}
    />
  );
}
