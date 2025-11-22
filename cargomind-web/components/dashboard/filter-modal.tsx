'use client';

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export interface FilterState {
    minPrice: string;
    maxPrice: string;
    minMarketCap: string;
    maxMarketCap: string;
    minVolume: string;
    maxVolume: string;
}

export interface ActiveFilters {
    minPrice?: number;
    maxPrice?: number;
    minMarketCap?: number;
    maxMarketCap?: number;
    minVolume?: number;
    maxVolume?: number;
}

interface FilterModalProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    activeFilters: ActiveFilters;
    setActiveFilters: React.Dispatch<React.SetStateAction<ActiveFilters>>;
    resetPage: () => void;
}

export function FilterModal({ filters, setFilters, activeFilters, setActiveFilters, resetPage }: FilterModalProps) {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs bg-background hover:bg-accent hover:text-accent-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {Object.keys(activeFilters).length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1 text-[10px] bg-primary/10 text-primary border-none">
                        {Object.keys(activeFilters).length}
                    </Badge>
                )}
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Market Filters</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Refine routes by price, volume, and capitalization.
                </p>
                <Separator />
                <div className="grid gap-4">
                    {/* Price Range */}
                    <div className="space-y-2">
                        <Label className="text-xs">Price Range (€/km)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Min" 
                                type="number" 
                                className="h-8"
                                value={filters.minPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input 
                                placeholder="Max" 
                                type="number" 
                                className="h-8"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Market Cap Range */}
                    <div className="space-y-2">
                        <Label className="text-xs">Market Cap (€)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Min (e.g. 100000)" 
                                type="number" 
                                className="h-8"
                                value={filters.minMarketCap}
                                onChange={(e) => setFilters(prev => ({ ...prev, minMarketCap: e.target.value }))}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input 
                                placeholder="Max" 
                                type="number" 
                                className="h-8"
                                value={filters.maxMarketCap}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxMarketCap: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Volume Range */}
                    <div className="space-y-2">
                        <Label className="text-xs">Volume 24h (€)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Min" 
                                type="number" 
                                className="h-8"
                                value={filters.minVolume}
                                onChange={(e) => setFilters(prev => ({ ...prev, minVolume: e.target.value }))}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input 
                                placeholder="Max" 
                                type="number" 
                                className="h-8"
                                value={filters.maxVolume}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxVolume: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => {
                        setFilters({ minPrice: '', maxPrice: '', minMarketCap: '', maxMarketCap: '', minVolume: '', maxVolume: '' });
                        setActiveFilters({});
                    }}
                >
                    Reset
                </Button>
                <Button 
                    onClick={() => {
                        const newFilters: ActiveFilters = {};
                        if (filters.minPrice) newFilters.minPrice = Number(filters.minPrice);
                        if (filters.maxPrice) newFilters.maxPrice = Number(filters.maxPrice);
                        
                        if (filters.minMarketCap) newFilters.minMarketCap = Number(filters.minMarketCap);
                        if (filters.maxMarketCap) newFilters.maxMarketCap = Number(filters.maxMarketCap);

                        if (filters.minVolume) newFilters.minVolume = Number(filters.minVolume);
                        if (filters.maxVolume) newFilters.maxVolume = Number(filters.maxVolume);

                        setActiveFilters(newFilters);
                        resetPage();
                    }}
                >
                    Apply Filters
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}



