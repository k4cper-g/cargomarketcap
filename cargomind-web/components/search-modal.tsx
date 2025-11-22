'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [dest, setDest] = useState(searchParams.get('dest') || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
      const params = new URLSearchParams(searchParams.toString());
      if (origin) params.set('origin', origin);
      else params.delete('origin');

      if (dest) params.set('dest', dest);
      else params.delete('dest');

      // Clear simple 'q' if using advanced search
      params.delete('q');

      router.replace(`/?${params.toString()}`);
      setOpen(false);
  };

  const clearFilters = () => {
      setOrigin('');
      setDest('');
      router.replace('/');
      setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <div className="flex items-center h-9 w-[200px] lg:w-[300px] pl-9 bg-muted/50 border border-input rounded-md text-sm text-muted-foreground">
                Search routes...
            </div>
            <div className="absolute right-2.5 top-2.5 text-xs text-muted-foreground bg-background px-1.5 rounded border">
              /
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Routes</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
             <label className="text-sm font-medium">Origin Country</label>
             <Input 
                placeholder="e.g. DE, FR, PL" 
                value={origin} 
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={2}
             />
          </div>
          <div className="grid gap-2">
             <label className="text-sm font-medium">Destination Country</label>
             <Input 
                placeholder="e.g. DE, FR, PL" 
                value={dest} 
                onChange={(e) => setDest(e.target.value.toUpperCase())}
                maxLength={2}
             />
          </div>
        </div>
        <div className="flex justify-between">
            <Button variant="ghost" onClick={clearFilters}>
                Clear
            </Button>
            <Button onClick={handleSearch}>
                Search
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

