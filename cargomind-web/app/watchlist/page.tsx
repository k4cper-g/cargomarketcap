'use client';

import DashboardClient from '../dashboard-client';

export default function WatchlistPage() {
    return (
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
    );
}
