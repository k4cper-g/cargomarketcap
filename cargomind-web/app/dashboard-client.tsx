'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { ArrowUp, Search, Star, MoreHorizontal, ChevronDown, ChevronUp, ArrowRight, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, ArrowLeftRight, MessageCircle, BarChart2, Loader2, Filter, Columns } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ReactCountryFlag from "react-country-flag";
import { RouteStat } from "@/lib/market-utils";
import { ModeToggle } from "@/components/mode-toggle";

import { useRouter, useSearchParams } from "next/navigation";
import { ColumnsModal } from "@/components/dashboard/columns-modal";
import { FilterModal, FilterState, ActiveFilters } from "@/components/dashboard/filter-modal";
import { useWatchlist } from "@/components/watchlist-provider";
import { useAuth } from "@/components/auth-provider";

// Map 2-letter country codes to country codes that react-country-flag understands (ISO 3166-1 alpha-2)
const getCountryCode = (code: string) => {
    if (code === 'UK') return 'GB';
    return code;
};

interface DashboardClientProps {
    initialData: RouteStat[];
    initialGlobalStats: {
        marketVol7d: number;
        vol24h: number;
        dominance: string;
    };
    initialTotalCount: number;
    onlyWatchlist?: boolean;
}

export default function DashboardClient({ initialData, initialGlobalStats, initialTotalCount, onlyWatchlist = false }: DashboardClientProps) {
    const { user, openAuthDialog } = useAuth();
    const { watchlist, isInWatchlist, toggleWatchlist, isLoading: isWatchlistLoading } = useWatchlist();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [searchOrigin, searchDest] = [searchParams.get('origin') || '', searchParams.get('dest') || ''];
    const initialSource = searchParams.get('source') || 'ALL';
    const [sourceFilter, setSourceFilter] = useState<string>(initialSource);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState({
        rank: true,
        route: true,
        price: true,
        change1h: true,
        change24h: true,
        change7d: true,
        marketCap: true,
        volume: true,
        chart: true,
        actions: true
    });

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        minPrice: '',
        maxPrice: '',
        minMarketCap: '',
        maxMarketCap: '',
        minVolume: '',
        maxVolume: '',
    });
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

    const [liveRoutes, setLiveRoutes] = useState<RouteStat[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
    const [subRouteCache, setSubRouteCache] = useState<Record<string, RouteStat[]>>({});
    const [loadingSubRoutes, setLoadingSubRoutes] = useState<Record<string, boolean>>({});
    const [sortConfig, setSortConfig] = useState<{ key: keyof RouteStat, direction: 'asc' | 'desc' } | null>(null);

    const [globalStats, setGlobalStats] = useState(initialGlobalStats);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalCount, setTotalCount] = useState(initialTotalCount);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftScroll(scrollLeft > 0);
            setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const handleSourceChange = (source: string) => {
        setSourceFilter(source);
        const params = new URLSearchParams(searchParams.toString());
        if (source && source !== 'ALL') {
            params.set('source', source);
        } else {
            params.delete('source');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        router && router.replace(`/?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    // Realtime Subscription - route_stats_live updates every 5 seconds (server-side throttled)
    useEffect(() => {
        // Update route directly from realtime payload - all fields pre-computed
        const updateRouteFromPayload = (payload: any) => {
            const newData = payload;
            const { origin_country, dest_country, body_group } = newData;

            if (body_group === 'ALL') {
                setLiveRoutes(currentRoutes =>
                    currentRoutes.map(route => {
                        if (route.origin_country === origin_country && route.dest_country === dest_country) {
                            // Update ALL fields from payload (server computed)
                            return {
                                ...route,
                                avg_rate_per_km: newData.avg_rate_per_km,
                                offers_count: newData.offers_count,
                                change_1h: newData.change_1h ?? route.change_1h,
                                change_24h: newData.change_24h ?? route.change_24h,
                                change_7d: newData.change_7d ?? route.change_7d,
                                volume_24h: newData.volume_24h ?? route.volume_24h,
                                market_cap: newData.market_cap ?? route.market_cap,
                                last_updated: newData.last_updated,
                                // Preserve: rank, sparkline (not in DB)
                            };
                        }
                        return route;
                    })
                );
            } else {
                const key = `${origin_country}-${dest_country}`;
                setSubRouteCache(currentCache => {
                    if (!currentCache[key]) return currentCache;
                    const updatedSubRoutes = currentCache[key].map(sub => {
                        if (sub.body_group === body_group) {
                            return {
                                ...sub,
                                avg_rate_per_km: newData.avg_rate_per_km,
                                offers_count: newData.offers_count,
                                change_1h: newData.change_1h ?? sub.change_1h,
                                change_24h: newData.change_24h ?? sub.change_24h,
                                change_7d: newData.change_7d ?? sub.change_7d,
                                volume_24h: newData.volume_24h ?? sub.volume_24h,
                                market_cap: newData.market_cap ?? sub.market_cap,
                                last_updated: newData.last_updated,
                            };
                        }
                        return sub;
                    });
                    return { ...currentCache, [key]: updatedSubRoutes };
                });
            }
        };

        // Subscribe to route_stats_live - already throttled server-side (every 5 seconds)
        const channel = supabase
            .channel('realtime-route-stats-live')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'route_stats_live' },
                (payload: any) => {
                    const newData = payload.new;
                    // Only update if the source matches our current filter
                    if (newData.source === sourceFilter) {
                        updateRouteFromPayload(newData);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sourceFilter]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    // Create a stable key for watchlist to avoid unnecessary refetches
    // Only changes when the actual routes in watchlist change, not on every render
    const watchlistKey = useMemo(() => {
        if (!onlyWatchlist) return '';
        return watchlist.map(w => `${w.origin_country}-${w.dest_country}`).sort().join(',');
    }, [watchlist, onlyWatchlist]);

    useEffect(() => {
        // Don't refetch on initial mount if we have data and it's the first page with default sort and no search
        if (!onlyWatchlist && page === 1 && !sortConfig && !searchQuery && !searchOrigin && !searchDest && sourceFilter === 'ALL' && Object.keys(activeFilters).length === 0 && liveRoutes.length > 0 && liveRoutes === initialData) {
            return;
        }
        fetchData();
    }, [page, itemsPerPage, sortConfig, searchQuery, searchOrigin, searchDest, sourceFilter, activeFilters, watchlistKey, onlyWatchlist]);

    async function fetchData() {
        setLoading(true);

        // Fetch from route_stats_live - all fields pre-computed server-side
        let query = supabase
            .from('route_stats_live')
            .select('*', { count: 'exact' })
            .eq('body_group', 'ALL')
            .eq('source', sourceFilter);

        if (onlyWatchlist) {
            if (!user || watchlist.length === 0) {
                setLiveRoutes([]);
                setTotalCount(0);
                setLoading(false);
                return;
            }
            const routeFilters = watchlist.map(
                item => `and(origin_country.eq.${item.origin_country},dest_country.eq.${item.dest_country})`
            ).join(',');
            query = query.or(routeFilters);
        }

        // Apply Filters
        if (activeFilters.minPrice) {
            query = query.gte('avg_rate_per_km', activeFilters.minPrice);
        }
        if (activeFilters.maxPrice) {
            query = query.lte('avg_rate_per_km', activeFilters.maxPrice);
        }

        // Filters on pre-computed columns
        if (activeFilters.minVolume) {
            query = query.gte('volume_24h', activeFilters.minVolume);
        }
        if (activeFilters.maxVolume) {
            query = query.lte('volume_24h', activeFilters.maxVolume);
        }
        if (activeFilters.minMarketCap) {
            query = query.gte('market_cap', activeFilters.minMarketCap);
        }
        if (activeFilters.maxMarketCap) {
            query = query.lte('market_cap', activeFilters.maxMarketCap);
        }

        if (searchQuery) {
            query = query.or(`origin_country.ilike.%${searchQuery}%,dest_country.ilike.%${searchQuery}%`);
        }

        if (searchOrigin) {
            query = query.eq('origin_country', searchOrigin);
        }

        if (searchDest) {
            query = query.eq('dest_country', searchDest);
        }

        // Sorting - now all fields are available for DB-side sorting
        if (sortConfig) {
            const dbSortKeys = ['offers_count', 'avg_rate_per_km', 'origin_country', 'change_1h', 'change_24h', 'change_7d', 'volume_24h', 'market_cap'];
            if (dbSortKeys.includes(sortConfig.key)) {
                query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
            } else {
                query = query.order('offers_count', { ascending: false });
            }
        } else {
            query = query.order('offers_count', { ascending: false });
        }

        const { data: routes, count } = await query
            .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

        if (count !== null) setTotalCount(count);

        // Fetch daily stats for global stats calculation only
        const { data: dailyStats } = await supabase
            .from('daily_market_stats')
            .select('origin_country, dest_country, body_group, stat_date, total_price_amount, total_distance_km, offer_count, source')
            .eq('body_group', 'ALL')
            .eq('source', sourceFilter)
            .gte('stat_date', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
            .order('stat_date', { ascending: false });

        if (routes) {
            // Update global stats if we have daily data
            if (dailyStats) {
                const todayStr = new Date().toISOString().split('T')[0];
                const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                let totalVol7d = 0;
                let totalVol24h = 0;
                const countryCounts: Record<string, number> = {};

                dailyStats.forEach((d: any) => {
                    const vol = Number(d.total_price_amount) || 0;
                    totalVol7d += vol;
                    if (d.stat_date === todayStr || d.stat_date === yesterdayStr) {
                        totalVol24h += vol;
                    }
                    countryCounts[d.origin_country] = (countryCounts[d.origin_country] || 0) + d.offer_count;
                    countryCounts[d.dest_country] = (countryCounts[d.dest_country] || 0) + d.offer_count;
                });

                const sortedCountries = Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 2);
                const totalActivity = Object.values(countryCounts).reduce((a, b) => a + b, 0);
                const dominanceStr = sortedCountries.length > 0
                    ? sortedCountries.map(([code, count]) => `${code} ${((count / totalActivity) * 100).toFixed(1)}%`).join(' ')
                    : "N/A";

                setGlobalStats({ marketVol7d: totalVol7d, vol24h: totalVol24h, dominance: dominanceStr });
            }

            // Data from route_stats_live already has all computed fields - just add rank
            const enriched: RouteStat[] = routes.map((r: any, i: number) => ({
                ...r,
                rank: (page - 1) * itemsPerPage + i + 1,
                sparkline: [] // sparkline not available from DB
            }));
            setLiveRoutes(enriched);
        }

        setLoading(false);
    }

    const handleSort = (key: keyof RouteStat) => {
        let direction: 'asc' | 'desc' = 'desc';

        if (sortConfig && sortConfig.key === key) {
            if (sortConfig.direction === 'desc') {
                direction = 'asc';
            } else {
                setSortConfig(null);
                return;
            }
        }

        setSortConfig({ key, direction });
    };

    const sortedRoutes = useMemo(() => {
        // Logic:
        // 1. The database returns a 'page' of data (e.g., 50 rows) based on DB sort (default: offers_count).
        // 2. If the user clicks a sort header:
        //    a) If it's a DB-supported key (offers_count, avg_rate_per_km, origin_country), we refetch from DB (fetchData handles this).
        //    b) If it's a computed key (change_*, volume, etc), we can ONLY sort the current page of data.

        if (!sortConfig) return liveRoutes;

        const serverSideKeys = ['offers_count', 'avg_rate_per_km', 'origin_country'];

        // If we are sorting by a server-side key, we trust that fetchData() already returned the correct order.
        if (serverSideKeys.includes(sortConfig.key)) {
            return liveRoutes;
        }

        // Otherwise, we are sorting the *currently visible page* by a client-side metric.
        return [...liveRoutes].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [liveRoutes, sortConfig]);

    const toggleRoute = async (route: RouteStat) => {
        const key = `${route.origin_country}-${route.dest_country}`;
        const newExpanded = new Set(expandedRoutes);

        if (newExpanded.has(key)) {
            newExpanded.delete(key);
            setExpandedRoutes(newExpanded);
            return;
        }

        // Add to expanded immediately to render placeholder or cached data
        newExpanded.add(key);
        setExpandedRoutes(newExpanded);

        // If we already have data, we don't need to do anything else
        // This prevents layout jump because we render immediately
        if (subRouteCache[key]) return;

        // Fetch sub-routes if not in cache
        setLoadingSubRoutes(prev => ({ ...prev, [key]: true }));

        // Fetch sub-routes from route_stats_live - all fields pre-computed
        const { data: subRoutes } = await supabase
            .from('route_stats_live')
            .select('*')
            .eq('origin_country', route.origin_country)
            .eq('dest_country', route.dest_country)
            .eq('source', sourceFilter)
            .neq('body_group', 'ALL')
            .order('offers_count', { ascending: false });

        if (subRoutes) {
            // Data already has all computed fields - just add rank and empty sparkline
            const enrichedSub: RouteStat[] = subRoutes.map((r: any, i: number) => ({
                ...r,
                rank: i + 1,
                sparkline: []
            }));
            setSubRouteCache(prev => ({ ...prev, [key]: enrichedSub }));
        }

        setLoadingSubRoutes(prev => ({ ...prev, [key]: false }));
    };

    // Computed properties for pagination
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startItem = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, totalCount);

    // Pagination generation logic
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
            range.push(i);
        }

        if (page - delta > 2) {
            range.unshift("...");
        }
        if (page + delta < totalPages - 1) {
            range.push("...");
        }

        range.unshift(1);
        if (totalPages > 1) {
            range.push(totalPages);
        }

        return range;
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {onlyWatchlist ? 'Your Watchlist' : 'Freight Market Prices by Volume'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Global average freight rates per km, volume, and market trends.
                        </p>
                    </div>
                </div>

                {/* Smart Narrative Filters */}
                <div className="relative group">
                    {showLeftScroll && (
                        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-background to-transparent pr-8 pl-2">
                            <button
                                className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                onClick={() => scroll('left')}
                            >
                                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    )}

                    <div
                        ref={scrollContainerRef}
                        onScroll={checkScroll}
                        className="flex gap-3 overflow-x-auto py-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide items-center"
                    >
                        {/* Topic Item */}
                        <div className="flex-shrink-0 bg-[#FFF8E5] hover:bg-[#FFF0C9] dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700/50 text-foreground text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-[#FAE0A8] transition-colors">
                            <span className="bg-[#F5A524] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">Topic</span>
                            <span>Mobility Package: Enforcement News</span>
                        </div>

                        {/* Fire Item */}
                        <div className="flex-shrink-0 bg-[#FFF8E5] hover:bg-[#FFF0C9] dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700/50 text-foreground text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-[#FAE0A8] transition-colors">
                            <span className="text-orange-500 text-sm">🔥</span>
                            <span>High Demand: ES → DE Refrigerated</span>
                        </div>

                        {/* Down Trend */}
                        <div className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-blue-100 transition-colors">
                            <TrendingDown className="w-3 h-3 text-red-500" />
                            <span>Why are UK export rates dropping?</span>
                        </div>

                        {/* Comparison */}
                        <div className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-blue-100 transition-colors">
                            <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                            <span>Spot vs Contract: Q4 Outlook</span>
                        </div>

                        {/* Trending */}
                        <div className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-blue-100 transition-colors">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span>Bullish momentum in Poland</span>
                        </div>

                        {/* Narratives */}
                        <div className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-blue-100 transition-colors">
                            <MessageCircle className="w-3 h-3 text-indigo-500" />
                            <span>What are the trending narratives?</span>
                        </div>

                        {/* Analysis */}
                        <div className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 border border-blue-100 transition-colors">
                            <BarChart2 className="w-3 h-3 text-orange-500" />
                            <span>Q4 2024 Freight Volume Forecast</span>
                        </div>
                    </div>

                    {showRightScroll && (
                        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-background to-transparent pl-8 pr-2">
                            <button
                                className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                onClick={() => scroll('right')}
                            >
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Toolbar: Source Filters & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Source Filter Pills */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSourceChange('ALL')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${sourceFilter === 'ALL' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <BarChart2 className={`w-4 h-4 ${sourceFilter === 'ALL' ? 'text-white' : 'text-muted-foreground'}`} />
                            All
                        </button>
                        <button
                            onClick={() => handleSourceChange('TIMOCOM')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${sourceFilter === 'TIMOCOM' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >

                            Timocom
                        </button>
                        <button
                            onClick={() => handleSourceChange('TRANSEU')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${sourceFilter === 'TRANSEU' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >

                            Trans.eu
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <FilterModal
                            filters={filters}
                            setFilters={setFilters}
                            activeFilters={activeFilters}
                            setActiveFilters={setActiveFilters}
                            resetPage={() => setPage(1)}
                        />

                        <ColumnsModal
                            visibleColumns={visibleColumns}
                            setVisibleColumns={setVisibleColumns}
                        />

                        <ModeToggle className="h-8 w-8" />
                    </div>
                </div>

                {/* Main Data Table */}
                <Card className="border-0 shadow-none bg-transparent">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-t border-b border-border/50 h-12">
                                <TableHead className="w-[40px]"></TableHead>

                                {visibleColumns.rank && (
                                    <TableHead className="w-[50px] font-bold text-foreground text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <span>#</span>
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.route && (
                                    <TableHead className="w-[250px] cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('origin_country')}>
                                        <div className="flex items-center gap-1">
                                            <span>Route Name</span>
                                            <SortArrow active={sortConfig?.key === 'origin_country'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.price && (
                                    <TableHead className="w-[100px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('avg_rate_per_km')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>Price (€/km)</span>
                                            <SortArrow active={sortConfig?.key === 'avg_rate_per_km'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.change1h && (
                                    <TableHead className="w-[80px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('change_1h')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>1h</span>
                                            <SortArrow active={sortConfig?.key === 'change_1h'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.change24h && (
                                    <TableHead className="w-[80px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('change_24h')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>24h</span>
                                            <SortArrow active={sortConfig?.key === 'change_24h'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.change7d && (
                                    <TableHead className="w-[80px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('change_7d')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>7d</span>
                                            <SortArrow active={sortConfig?.key === 'change_7d'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.volume && (
                                    <TableHead className="w-[120px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('volume_24h')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>24h Volume</span>
                                            <SortArrow active={sortConfig?.key === 'volume_24h'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.marketCap && (
                                    <TableHead className="w-[120px] text-right cursor-pointer hover:text-primary group font-bold text-foreground text-xs whitespace-nowrap" onClick={() => handleSort('market_cap')}>
                                        <div className="flex items-center justify-end gap-1">
                                            <span>Route Value</span>
                                            <SortArrow active={sortConfig?.key === 'market_cap'} direction={sortConfig?.direction} />
                                        </div>
                                    </TableHead>
                                )}

                                {visibleColumns.chart && (
                                    <TableHead className="w-[150px] text-right font-bold text-foreground text-xs whitespace-nowrap">Last 24 Hours</TableHead>
                                )}
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRoutes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full w-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            "No routes found."
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedRoutes.map((route, index) => {
                                    const key = `${route.origin_country}-${route.dest_country}`;
                                    const isExpanded = expandedRoutes.has(key);
                                    const subRoutes = subRouteCache[key] || [];
                                    const isLoadingSubs = loadingSubRoutes[key];

                                    return (
                                        <React.Fragment key={`${key}-${index}`}>
                                            <TableRow
                                                className="hover:bg-muted/50 border-b border-border/50 cursor-pointer transition-colors"
                                                onClick={() => toggleRoute(route)}
                                            >
                                                <TableCell>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('Toggling watchlist:', route.origin_country, route.dest_country);
                                                            toggleWatchlist(route.origin_country, route.dest_country);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                    >
                                                        <Star
                                                            className={`w-4 h-4 transition-colors ${isInWatchlist(route.origin_country, route.dest_country)
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-muted-foreground hover:text-yellow-400'
                                                                }`}
                                                        />
                                                    </button>
                                                </TableCell>

                                                {visibleColumns.rank && (
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                )}

                                                {visibleColumns.route && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-2">
                                                                <div className="relative z-20">
                                                                    <ReactCountryFlag
                                                                        countryCode={getCountryCode(route.origin_country)}
                                                                        svg
                                                                        className="rounded-full border border-muted-foreground/20"
                                                                        style={{ width: '1.5em', height: '1.5em', objectFit: 'cover' }}
                                                                    />
                                                                </div>
                                                                <div className="relative z-10 -ml-2">
                                                                    <ReactCountryFlag
                                                                        countryCode={getCountryCode(route.dest_country)}
                                                                        svg
                                                                        className="rounded-full border border-muted-foreground/20"
                                                                        style={{ width: '1.5em', height: '1.5em', objectFit: 'cover' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm flex items-center gap-1">
                                                                    {route.origin_country}
                                                                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                                                                    {route.dest_country}
                                                                </span>
                                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {visibleColumns.price && (
                                                    <TableCell className="text-right font-semibold">
                                                        <LiveTickerCell
                                                            value={route.avg_rate_per_km}
                                                            formatter={(val) => `€${val.toFixed(2)}`}
                                                        />
                                                    </TableCell>
                                                )}

                                                {visibleColumns.change1h && (
                                                    <TableCell className="text-right text-xs font-medium">
                                                        <ChangeIndicator value={route.change_1h || 0} />
                                                    </TableCell>
                                                )}

                                                {visibleColumns.change24h && (
                                                    <TableCell className="text-right text-xs font-medium">
                                                        <ChangeIndicator value={route.change_24h || 0} />
                                                    </TableCell>
                                                )}

                                                {visibleColumns.change7d && (
                                                    <TableCell className="text-right text-xs font-medium">
                                                        <ChangeIndicator value={route.change_7d || 0} />
                                                    </TableCell>
                                                )}

                                                {visibleColumns.marketCap && (
                                                    <TableCell className="text-right text-sm font-medium">
                                                        €{((route.market_cap || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </TableCell>
                                                )}

                                                {visibleColumns.volume && (
                                                    <TableCell className="text-right text-sm font-medium">
                                                        <div className="flex flex-col items-end">
                                                            <span>€{((route.volume_24h || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {visibleColumns.chart && (
                                                    <TableCell>
                                                        <div className="h-[35px] w-[140px]">
                                                            {route.sparkline && route.sparkline.length > 0 && (
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <LineChart data={route.sparkline}>
                                                                        <Line
                                                                            type="monotone"
                                                                            dataKey="value"
                                                                            stroke={(route.change_1h || 0) >= 0 ? "#16c784" : "hsl(var(--destructive))"}
                                                                            strokeWidth={2}
                                                                            dot={false}
                                                                        />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.actions && (
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem>View Analysis</DropdownMenuItem>
                                                                <DropdownMenuItem>Set Price Alert</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>Trade (Book)</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </TableRow>

                                            {/* Expanded Sub-Rows */}
                                            {isExpanded && (
                                                <>
                                                    {isLoadingSubs ? (
                                                        <TableRow className="bg-muted/20">
                                                            <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="h-[40px] py-0">
                                                                <div className="flex items-center justify-center h-full w-full">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        subRoutes.map((sub, subIndex) => (
                                                            <TableRow key={`${sub.origin_country}-${sub.dest_country}-${sub.body_group}-${subIndex}`} className="bg-muted/10 border-b border-border/30 h-8">
                                                                <TableCell className="py-1"></TableCell>

                                                                {visibleColumns.rank && <TableCell className="py-1"></TableCell>}

                                                                {visibleColumns.route && (
                                                                    <TableCell className="py-1">
                                                                        <div className="flex items-center gap-3 pl-12">
                                                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm tracking-wide truncate max-w-[120px]">
                                                                                {formatBodyGroup(sub.body_group)}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.price && (
                                                                    <TableCell className="text-right font-semibold text-xs py-1">
                                                                        <LiveTickerCell
                                                                            value={sub.avg_rate_per_km}
                                                                            formatter={(val) => `€${val.toFixed(2)}`}
                                                                        />
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.change1h && (
                                                                    <TableCell className="text-right text-[10px] font-medium py-1">
                                                                        <ChangeIndicator value={sub.change_1h || 0} />
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.change24h && (
                                                                    <TableCell className="text-right text-[10px] font-medium py-1">
                                                                        <ChangeIndicator value={sub.change_24h || 0} />
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.change7d && (
                                                                    <TableCell className="text-right text-[10px] font-medium py-1">
                                                                        <ChangeIndicator value={sub.change_7d || 0} />
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.marketCap && (
                                                                    <TableCell className="text-right text-[10px] font-medium text-muted-foreground py-1">
                                                                        €{((sub.market_cap || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.volume && (
                                                                    <TableCell className="text-right text-[10px] font-medium text-muted-foreground py-1">
                                                                        €{((sub.volume_24h || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.chart && (
                                                                    <TableCell className="py-1">
                                                                        <div className="h-[20px] w-[140px] opacity-70">
                                                                            {sub.sparkline && sub.sparkline.length > 0 && (
                                                                                <ResponsiveContainer width="100%" height="100%">
                                                                                    <LineChart data={sub.sparkline}>
                                                                                        <Line
                                                                                            type="monotone"
                                                                                            dataKey="value"
                                                                                            stroke={(sub.change_1h || 0) >= 0 ? "#16c784" : "hsl(var(--destructive))"}
                                                                                            strokeWidth={1}
                                                                                            dot={false}
                                                                                        />
                                                                                    </LineChart>
                                                                                </ResponsiveContainer>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.actions && <TableCell className="py-1"></TableCell>}
                                                            </TableRow>
                                                        ))
                                                    )}
                                                    {/* If no subs found (unlikely if aggregate exists but possible if data is weird) */}
                                                    {!isLoadingSubs && subRoutes.length === 0 && (
                                                        <TableRow className="bg-muted/20">
                                                            <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center text-xs py-2 text-muted-foreground">
                                                                No detailed breakdown available.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Pagination Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-4 text-sm text-muted-foreground">
                    <div className="text-left">
                        Showing {startItem} - {endItem} out of {totalCount}
                    </div>

                    <div className="flex items-center justify-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {getPageNumbers().map((p, idx) => (
                            p === "..." ? (
                                <span key={`ellipsis-${idx}`} className="px-2">...</span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${page === p ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                                    onClick={() => setPage(Number(p))}
                                    disabled={loading}
                                >
                                    {p}
                                </Button>
                            )
                        ))}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <span>Show rows:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                    {itemsPerPage} <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {[20, 50, 100].map((size) => (
                                    <DropdownMenuItem
                                        key={size}
                                        onClick={() => {
                                            setItemsPerPage(size);
                                            setPage(1);
                                        }}
                                    >
                                        {size}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div >
    );
}

function SortArrow({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
    // Using absolute positioning to keep it from affecting layout flow
    // Or we can just use a fixed width container if we prefer
    // But request was "not affect viewport" which usually means not shifting text
    if (!active) return <div className="w-3 h-3 inline-flex" />; // Placeholder to keep alignment if we want stable width

    return (
        <div className={`w-3 h-3 flex-shrink-0 text-primary inline-flex items-center justify-center`}>
            {direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
    )
}

function formatBodyGroup(group: string) {
    return group
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Helper Component for % Change with smooth transitions
function ChangeIndicator({ value }: { value: number }) {
    // Track stable value to prevent flickering from small recalculations
    const stableValueRef = useRef(value);
    const [displayValue, setDisplayValue] = useState(value);

    // Threshold for considering a change meaningful (0.1% absolute change)
    const CHANGE_THRESHOLD = 0.1;

    useEffect(() => {
        const diff = Math.abs(value - stableValueRef.current);
        // Only update display if change is meaningful
        if (diff >= CHANGE_THRESHOLD) {
            stableValueRef.current = value;
            setDisplayValue(value);
        }
    }, [value]);

    const isPositive = displayValue >= 0;

    return (
        <div className={`flex items-center justify-end gap-1 font-semibold transition-colors duration-300 ${isPositive ? 'text-[#01921c]' : 'text-destructive'}`}>
            <span className={`transition-transform duration-300 ${isPositive ? 'rotate-0' : 'rotate-180'}`}>
                <ArrowUp className="w-3 h-3" />
            </span>
            {Math.abs(displayValue).toFixed(2)}%
        </div>
    )
}

function LiveTickerCell({ value, className, formatter }: { value: number, className?: string, formatter?: (val: number) => React.ReactNode }) {
    // Track the "stable" value - only update when change is meaningful
    const stableValueRef = useRef(value);
    const [flash, setFlash] = useState<'green' | 'red' | null>(null);
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Minimum % change threshold to trigger flash (0.5%)
    const FLASH_THRESHOLD = 0.005;

    // Only respond to value changes, NOT flash changes
    useEffect(() => {
        const stableValue = stableValueRef.current;

        // Calculate percentage change from stable value
        const percentChange = stableValue !== 0
            ? Math.abs((value - stableValue) / stableValue)
            : (value !== 0 ? 1 : 0);

        // Only flash if change exceeds threshold
        if (percentChange >= FLASH_THRESHOLD) {
            const newFlash = value > stableValue ? 'green' : 'red';

            // Update stable value to new value
            stableValueRef.current = value;

            // Clear existing timeout before setting new one
            if (flashTimeoutRef.current) {
                clearTimeout(flashTimeoutRef.current);
            }

            // Set the flash color
            setFlash(newFlash);

            // Reset flash after delay
            flashTimeoutRef.current = setTimeout(() => {
                setFlash(null);
                flashTimeoutRef.current = null;
            }, 2000);
        }
    }, [value]); // Only depend on value, NOT flash

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            if (flashTimeoutRef.current) {
                clearTimeout(flashTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className={`transition-colors duration-500 inline-block ${flash === 'green' ? 'text-[#16c784]' : flash === 'red' ? 'text-destructive' : ''} ${className}`}>
            {formatter ? formatter(value) : value}
        </div>
    );
}

