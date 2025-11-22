'use client';

import { Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ColumnsModalProps {
  visibleColumns: {
    rank: boolean;
    route: boolean;
    price: boolean;
    change1h: boolean;
    change24h: boolean;
    change7d: boolean;
    marketCap: boolean;
    volume: boolean;
    chart: boolean;
    actions: boolean;
  };
  setVisibleColumns: React.Dispatch<React.SetStateAction<{
    rank: boolean;
    route: boolean;
    price: boolean;
    change1h: boolean;
    change24h: boolean;
    change7d: boolean;
    marketCap: boolean;
    volume: boolean;
    chart: boolean;
    actions: boolean;
  }>>;
}

export function ColumnsModal({ visibleColumns, setVisibleColumns }: ColumnsModalProps) {
  const toggleColumn = (key: keyof typeof visibleColumns) => {
      setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs bg-background hover:bg-accent hover:text-accent-foreground">
                <Columns className="h-3.5 w-3.5" />
                Columns
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Toggle Columns</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-rank" checked={visibleColumns.rank} onCheckedChange={() => toggleColumn('rank')} />
                    <Label htmlFor="col-rank">Rank (#)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-route" checked={visibleColumns.route} onCheckedChange={() => toggleColumn('route')} />
                    <Label htmlFor="col-route">Route Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-price" checked={visibleColumns.price} onCheckedChange={() => toggleColumn('price')} />
                    <Label htmlFor="col-price">Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-change1h" checked={visibleColumns.change1h} onCheckedChange={() => toggleColumn('change1h')} />
                    <Label htmlFor="col-change1h">1h %</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-change24h" checked={visibleColumns.change24h} onCheckedChange={() => toggleColumn('change24h')} />
                    <Label htmlFor="col-change24h">24h %</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-change7d" checked={visibleColumns.change7d} onCheckedChange={() => toggleColumn('change7d')} />
                    <Label htmlFor="col-change7d">7d %</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-marketCap" checked={visibleColumns.marketCap} onCheckedChange={() => toggleColumn('marketCap')} />
                    <Label htmlFor="col-marketCap">Market Cap</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-volume" checked={visibleColumns.volume} onCheckedChange={() => toggleColumn('volume')} />
                    <Label htmlFor="col-volume">Volume (24h)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="col-chart" checked={visibleColumns.chart} onCheckedChange={() => toggleColumn('chart')} />
                    <Label htmlFor="col-chart">Last 24h</Label>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}



