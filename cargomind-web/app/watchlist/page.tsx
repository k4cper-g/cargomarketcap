'use client';

import { Suspense } from 'react';
import DashboardClient from '../dashboard-client';

export default function WatchlistPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
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
