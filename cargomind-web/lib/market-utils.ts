// --- Types ---
export interface RouteStat {
  origin_country: string;
  dest_country: string;
  body_group: string;
  avg_rate_per_km: number;
  offers_count: number;
  last_updated: string;
  // Augmented fields for UI
  rank?: number;
  change_1h?: number;
  change_24h?: number;
  change_7d?: number;
  market_cap?: number;
  volume_24h?: number;
  sparkline?: { value: number }[];
}

// Helper for calculating enriched stats from raw data
export function enrichRouteData(
    baseRoutes: any[],
    hourlyChanges: any[],
    dailyStats: any[],
    baseRank: number = 0
): RouteStat[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastWeekDateStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    return baseRoutes.map((r: any, i: number) => {
        // Key matching: must match ALL keys including body_group AND source (if available in r)
        const key = (d: any) => {
            const baseMatch = d.origin_country === r.origin_country && d.dest_country === r.dest_country && d.body_group === r.body_group;
            if (r.source) {
                return baseMatch && d.source === r.source;
            }
            return baseMatch;
        };
        
        const routeHourly = hourlyChanges?.filter(key) || [];
        const routeDaily = dailyStats?.filter(key) || [];

        // 1h Change
        const currentRate = r.avg_rate_per_km;
        const now = new Date().getTime();
        const oneHourAgo = now - 1 * 60 * 60 * 1000;
        
        const pastPoint = routeHourly.find((h: any) => new Date(h.stat_hour).getTime() >= oneHourAgo);
        const oneHourAgoRate = pastPoint ? pastPoint.avg_rate_per_km : currentRate;
        const realChange1h = oneHourAgoRate ? ((currentRate - oneHourAgoRate) / oneHourAgoRate) * 100 : 0;

        // Sparkline
        const sparklineData = routeHourly.map((h: any) => ({ value: h.avg_rate_per_km }));

        // Daily Logic (24h & 7d)
        const todayStat = routeDaily.find((d: any) => d.stat_date === todayStr) || routeDaily[0];
        const yesterdayStat = routeDaily.find((d: any) => d.stat_date === yesterdayStr) || routeDaily[1];
        const lastWeekStat = routeDaily.find((d: any) => d.stat_date === lastWeekDateStr) || routeDaily[routeDaily.length - 1];

        const getRate = (s: any) => (s && s.total_distance_km > 0) ? (s.total_price_amount / s.total_distance_km) : null;

        const rateToday = getRate(todayStat) || currentRate;
        const rateYesterday = getRate(yesterdayStat) || rateToday;
        const rateLastWeek = getRate(lastWeekStat) || rateToday;

        const realChange24h = rateYesterday ? ((rateToday - rateYesterday) / rateYesterday) * 100 : 0;
        const realChange7d = rateLastWeek ? ((rateToday - rateLastWeek) / rateLastWeek) * 100 : 0;

        // Volumes & Market Cap
        const vol7d = routeDaily.reduce((sum: number, d: any) => sum + (Number(d.total_price_amount) || 0), 0);
        const vol24h = (Number(todayStat?.total_price_amount) || 0) + (todayStat?.stat_date === todayStr ? 0 : (Number(yesterdayStat?.total_price_amount) || 0));
        const marketCap = vol7d * 52;

        return {
            ...r,
            rank: baseRank + i + 1,
            change_1h: realChange1h,
            change_24h: realChange24h,
            change_7d: realChange7d,
            market_cap: marketCap,
            volume_24h: vol24h,
            sparkline: sparklineData
        };
    });
}

