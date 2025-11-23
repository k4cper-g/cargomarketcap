import { supabase } from '@/lib/supabaseClient';
import DashboardClient from './dashboard-client';
import { RouteStat } from '@/lib/market-utils';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const itemsPerPage = 50;
  const page = 1;

  // Fetch from route_stats
  const { data: routes, count } = await supabase
    .from('route_stats')
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

  // Fetch hourly stats for sparkline and change calculations (last 7 days)
  const { data: hourlyStats } = await supabase
      .from('hourly_market_stats')
      .select('origin_country, dest_country, body_group, source, stat_hour, avg_rate_per_km')
      .eq('body_group', 'ALL')
      .eq('source', 'ALL')
      .gte('stat_hour', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
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

  // Build hourly stats lookup by route
  const hourlyLookup: Record<string, { stat_hour: string; avg_rate_per_km: number }[]> = {};
  if (hourlyStats) {
    hourlyStats.forEach((h: any) => {
      const key = `${h.origin_country}-${h.dest_country}`;
      if (!hourlyLookup[key]) {
        hourlyLookup[key] = [];
      }
      hourlyLookup[key].push({ stat_hour: h.stat_hour, avg_rate_per_km: h.avg_rate_per_km });
    });
  }

  // Helper to find rate at a specific time ago
  const findRateAtTime = (routeHourly: { stat_hour: string; avg_rate_per_km: number }[], hoursAgo: number) => {
    const targetTime = Date.now() - hoursAgo * 60 * 60 * 1000;
    let closest = null;
    for (const h of routeHourly) {
      const hTime = new Date(h.stat_hour).getTime();
      if (hTime <= targetTime) {
        closest = h;
      }
    }
    return closest?.avg_rate_per_km;
  };

  // Enrich routes with computed change values and sparkline
  const initialData: RouteStat[] = (routes || []).map((r: any, i: number) => {
    const key = `${r.origin_country}-${r.dest_country}`;
    const routeHourly = hourlyLookup[key] || [];

    // Sparkline: last 24 hours only
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const sparkline = routeHourly
      .filter(h => new Date(h.stat_hour).getTime() >= last24h)
      .map(h => ({ value: h.avg_rate_per_km }));

    // Compute changes from hourly stats
    const currentRate = r.avg_rate_per_km;
    const rate1hAgo = findRateAtTime(routeHourly, 1);
    const rate24hAgo = findRateAtTime(routeHourly, 24);
    const rate7dAgo = findRateAtTime(routeHourly, 24 * 7);

    const change_1h = rate1hAgo && rate1hAgo > 0 ? ((currentRate - rate1hAgo) / rate1hAgo) * 100 : 0;
    const change_24h = rate24hAgo && rate24hAgo > 0 ? ((currentRate - rate24hAgo) / rate24hAgo) * 100 : 0;
    const change_7d = rate7dAgo && rate7dAgo > 0 ? ((currentRate - rate7dAgo) / rate7dAgo) * 100 : 0;

    return {
      ...r,
      rank: i + 1,
      sparkline,
      change_1h,
      change_24h,
      change_7d
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
