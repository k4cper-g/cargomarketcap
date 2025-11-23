'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Star, MoreHorizontal, ChevronDown, ChevronUp, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactCountryFlag from "react-country-flag";
import { enrichRouteData, RouteStat } from "@/lib/market-utils";
import { useWatchlist } from "@/components/watchlist-provider";
import { useAuth } from "@/components/auth-provider";

const getCountryCode = (code: string) => {
    if (code === 'UK') return 'GB';
    return code;
};

export default function WatchlistPage() {
    const { user, openAuthDialog } = useAuth();
    const { watchlist, isInWatchlist, toggleWatchlist } = useWatchlist();
    const [routes, setRoutes] = useState<RouteStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
    const [subRouteCache, setSubRouteCache] = useState<Record<string, RouteStat[]>>({});
    const [loadingSubRoutes, setLoadingSubRoutes] = useState<Record<string, boolean>>({});

    // Fetch route data for watchlist items
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        if (watchlist.length === 0) {
            setRoutes([]);
            setLoading(false);
            return;
        }

        fetchWatchlistRoutes();
    }, [user, watchlist]);

    async function fetchWatchlistRoutes() {
        setLoading(true);

        // Build OR filter for all watchlist routes
        const routeFilters = watchlist.map(
            item => `and(origin_country.eq.${item.origin_country},dest_country.eq.${item.dest_country})`
        ).join(',');

        const { data: routeData } = await supabase
            .from('route_stats')
            .select('*')
            .eq('body_group', 'ALL')
            .eq('source', 'ALL')
            .or(routeFilters);

        if (!routeData || routeData.length === 0) {
            setRoutes([]);
            setLoading(false);
            return;
        }

        // Fetch hourly stats for sparklines
        const { data: hourlyData } = await supabase
            .from('hourly_market_stats')
            .select('origin_country, dest_country, body_group, stat_hour, avg_rate_per_km, source')
            .eq('body_group', 'ALL')
            .eq('source', 'ALL')
            .or(routeFilters)
            .gt('stat_hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('stat_hour', { ascending: true });

        // Fetch daily stats for changes
        const { data: dailyData } = await supabase
            .from('daily_market_stats')
            .select('origin_country, dest_country, body_group, stat_date, total_price_amount, total_distance_km, offer_count, source')
            .eq('body_group', 'ALL')
            .eq('source', 'ALL')
            .or(routeFilters)
            .gte('stat_date', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
            .order('stat_date', { ascending: false });

        const enriched = enrichRouteData(routeData, hourlyData || [], dailyData || []);
        setRoutes(enriched);
        setLoading(false);
    }

    const toggleRoute = async (route: RouteStat) => {
        const key = `${route.origin_country}-${route.dest_country}`;
        const newExpanded = new Set(expandedRoutes);

        if (newExpanded.has(key)) {
            newExpanded.delete(key);
            setExpandedRoutes(newExpanded);
            return;
        }

        newExpanded.add(key);
        setExpandedRoutes(newExpanded);

        if (subRouteCache[key]) return;

        setLoadingSubRoutes(prev => ({ ...prev, [key]: true }));

        const { data: subRoutes } = await supabase
            .from('route_stats')
            .select('*')
            .eq('origin_country', route.origin_country)
            .eq('dest_country', route.dest_country)
            .eq('source', 'ALL')
            .neq('body_group', 'ALL')
            .order('offers_count', { ascending: false });

        const { data: subHourly } = await supabase
            .from('hourly_market_stats')
            .select('origin_country, dest_country, body_group, stat_hour, avg_rate_per_km, source')
            .eq('origin_country', route.origin_country)
            .eq('dest_country', route.dest_country)
            .eq('source', 'ALL')
            .neq('body_group', 'ALL')
            .gt('stat_hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('stat_hour', { ascending: true });

        const { data: subDaily } = await supabase
            .from('daily_market_stats')
            .select('origin_country, dest_country, body_group, stat_date, total_price_amount, total_distance_km, offer_count, source')
            .eq('origin_country', route.origin_country)
            .eq('dest_country', route.dest_country)
            .eq('source', 'ALL')
            .neq('body_group', 'ALL')
            .gte('stat_date', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
            .order('stat_date', { ascending: false });

        if (subRoutes && subHourly && subDaily) {
            const enrichedSub = enrichRouteData(subRoutes, subHourly, subDaily);
            setSubRouteCache(prev => ({ ...prev, [key]: enrichedSub }));
        }

        setLoadingSubRoutes(prev => ({ ...prev, [key]: false }));
    };

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
                <Star className="w-16 h-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Your Watchlist</h1>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Sign in to save your favorite routes and track them in one place.
                </p>
                <Button onClick={openAuthDialog}>
                    Sign In to Continue
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            Your Watchlist
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {routes.length} route{routes.length !== 1 ? 's' : ''} saved
                        </p>
                    </div>
                </div>

                {/* Empty State */}
                {!loading && routes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Star className="w-12 h-12 text-muted-foreground mb-4" />
                        <h2 className="text-lg font-semibold mb-2">No routes in your watchlist</h2>
                        <p className="text-muted-foreground max-w-md">
                            Click the star icon next to any route on the main page to add it to your watchlist.
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Routes Table */}
                {!loading && routes.length > 0 && (
                    <Card className="border-0 shadow-none bg-transparent">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-t border-b border-border/50 h-12">
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead className="w-[50px] font-bold text-foreground text-xs">#</TableHead>
                                    <TableHead className="w-[250px] font-bold text-foreground text-xs">Route Name</TableHead>
                                    <TableHead className="w-[100px] text-right font-bold text-foreground text-xs">Price (€/km)</TableHead>
                                    <TableHead className="w-[80px] text-right font-bold text-foreground text-xs">1h</TableHead>
                                    <TableHead className="w-[80px] text-right font-bold text-foreground text-xs">24h</TableHead>
                                    <TableHead className="w-[80px] text-right font-bold text-foreground text-xs">7d</TableHead>
                                    <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">24h Volume</TableHead>
                                    <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">Route Value</TableHead>
                                    <TableHead className="w-[150px] text-right font-bold text-foreground text-xs">Last 24 Hours</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {routes.map((route, index) => {
                                    const key = `${route.origin_country}-${route.dest_country}`;
                                    const isExpanded = expandedRoutes.has(key);
                                    const subRoutes = subRouteCache[key] || [];
                                    const isLoadingSubs = loadingSubRoutes[key];

                                    return (
                                        <React.Fragment key={key}>
                                            <TableRow
                                                className="hover:bg-muted/50 border-b border-border/50 cursor-pointer transition-colors"
                                                onClick={() => toggleRoute(route)}
                                            >
                                                <TableCell>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleWatchlist(route.origin_country, route.dest_country);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                    >
                                                        <Star
                                                            className={`w-4 h-4 transition-colors ${
                                                                isInWatchlist(route.origin_country, route.dest_country)
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-muted-foreground hover:text-yellow-400'
                                                            }`}
                                                        />
                                                    </button>
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>

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

                                                <TableCell className="text-right font-semibold">
                                                    €{route.avg_rate_per_km.toFixed(2)}
                                                </TableCell>

                                                <TableCell className="text-right text-xs font-medium">
                                                    <ChangeIndicator value={route.change_1h || 0} />
                                                </TableCell>

                                                <TableCell className="text-right text-xs font-medium">
                                                    <ChangeIndicator value={route.change_24h || 0} />
                                                </TableCell>

                                                <TableCell className="text-right text-xs font-medium">
                                                    <ChangeIndicator value={route.change_7d || 0} />
                                                </TableCell>

                                                <TableCell className="text-right text-sm font-medium">
                                                    €{((route.volume_24h || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </TableCell>

                                                <TableCell className="text-right text-sm font-medium">
                                                    €{((route.market_cap || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </TableCell>

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
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleWatchlist(route.origin_country, route.dest_country);
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                Remove from Watchlist
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Sub-Rows */}
                                            {isExpanded && (
                                                <>
                                                    {isLoadingSubs ? (
                                                        <TableRow className="bg-muted/20">
                                                            <TableCell colSpan={11} className="h-[40px] py-0">
                                                                <div className="flex items-center justify-center h-full w-full">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        subRoutes.map((sub, subIndex) => (
                                                            <TableRow key={`${sub.origin_country}-${sub.dest_country}-${sub.body_group}-${subIndex}`} className="bg-muted/10 border-b border-border/30 h-8">
                                                                <TableCell className="py-1"></TableCell>
                                                                <TableCell className="py-1"></TableCell>
                                                                <TableCell className="py-1">
                                                                    <div className="flex items-center gap-3 pl-12">
                                                                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm tracking-wide truncate max-w-[120px]">
                                                                            {formatBodyGroup(sub.body_group)}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold text-xs py-1">
                                                                    €{sub.avg_rate_per_km.toFixed(2)}
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] font-medium py-1">
                                                                    <ChangeIndicator value={sub.change_1h || 0} />
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] font-medium py-1">
                                                                    <ChangeIndicator value={sub.change_24h || 0} />
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] font-medium py-1">
                                                                    <ChangeIndicator value={sub.change_7d || 0} />
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] font-medium text-muted-foreground py-1">
                                                                    €{((sub.volume_24h || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] font-medium text-muted-foreground py-1">
                                                                    €{((sub.market_cap || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                </TableCell>
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
                                                                <TableCell className="py-1"></TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                    {!isLoadingSubs && subRoutes.length === 0 && (
                                                        <TableRow className="bg-muted/20">
                                                            <TableCell colSpan={11} className="text-center text-xs py-2 text-muted-foreground">
                                                                No detailed breakdown available.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </div>
    );
}

function formatBodyGroup(group: string) {
    return group
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function ChangeIndicator({ value }: { value: number }) {
    const isPositive = value >= 0;
    return (
        <div className={`flex items-center justify-end gap-1 font-semibold ${isPositive ? 'text-[#01921c]' : 'text-destructive'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(value).toFixed(2)}%
        </div>
    );
}
