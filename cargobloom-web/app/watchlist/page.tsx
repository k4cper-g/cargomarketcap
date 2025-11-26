'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardClient from '../dashboard-client';

export default function WatchlistPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <DashboardClient
                initialData={[]}
                initialGlobalStats={{
                    marketVol7d: 0,
                    vol24h: 0,
                    dominance: "N/A"
                }}
                initialTotalCount={0}
                onlyWatchlist={true}
            />
        </Suspense>
    );
}
