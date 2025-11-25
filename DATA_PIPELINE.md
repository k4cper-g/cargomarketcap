# CargoBloom Data Pipeline Documentation

## Overview

This document outlines the end-to-end data pipeline for CargoBloom, detailing how freight market data is collected, processed, stored, and displayed. The system aggregates real-time offer data from major freight exchanges to provide market insights.

## 1. Data Collection (`cargobloom-extension`)

The entry point for data is the **CargoBloom Chrome Extension**. It operates by intercepting network traffic on supported freight exchange platforms.

### Mechanism
-   **Target Platforms**: `trans.eu` and `timocom.com`.
-   **Interception**: The extension injects a script (`injected.js`) into the page context. This script overrides `window.fetch` and `XMLHttpRequest` to listen for specific API responses.
    -   **Offers**: Intercepts endpoints like `freight-search-offers`.
    -   **Dictionaries**: Intercepts metadata endpoints for currencies, vehicle bodies, and locations.
-   **Data Flow**:
    1.  `injected.js` captures the raw JSON response.
    2.  Data is sent to the content script (`content.js`) via `window.postMessage`.
    3.  The content script forwards the data to the background service worker (`background.js`) via `chrome.runtime.sendMessage`.
    4.  The background script processes the data (deduplication, formatting) and sends it to the Supabase backend.

### Data Points Collected
-   **Route**: Origin and Destination (Country, Zip Code).
-   **Price**: Amount and Currency.
-   **Cargo**: Vehicle Body Type, Distance.
-   **Source**: The platform where the offer originated (e.g., TIMOCOM, TRANSEU).

---

## 2. Data Storage & Calculation (`supabase`)

Data is stored and processed in a **Supabase (PostgreSQL)** database. The system uses a "push-based" aggregation model where data is processed immediately upon insertion using Database Triggers.

### Ingestion Layer
-   **`raw_offers` Table**: Stores the raw, unprocessed offers received from the extension.
-   **Deduplication**: The background script calculates a hash of the offer batch to prevent sending duplicate data. Supabase also enforces uniqueness on `original_id`.

### Processing Logic (Triggers & Functions)
When a new row is inserted into `raw_offers`, multiple triggers fire to update the statistical tables.

#### Sanity Checks
Before processing, data undergoes sanity checks:
-   **Price Range**: Rates must be between **0.2 €/km** and **10.0 €/km**. Outliers are discarded to prevent skewing stats.

#### Aggregation Tables
1.  **`route_stats` (Live Market State)**
    -   **Purpose**: Stores the current "live" statistics for every unique route (Origin -> Destination + Body Type).
    -   **Calculation Method**:
        -   **Average Rate**: Cumulative Moving Average (CMA) of all valid offers.
        -   **EMA Rate**: Exponential Moving Average (Alpha = 0.1). This gives more weight to recent offers, making the "Live Rate" responsive to market changes.
        -   **Formula**: `NewEMA = PreviousEMA + 0.1 * (NewRate - PreviousEMA)`
    -   **Grouping**: Grouped by Origin Country, Destination Country, Body Group, and Source.

2.  **`hourly_market_stats` (Time-Series)**
    -   **Purpose**: Aggregates data by hour for historical analysis and trend charts (sparklines).
    -   **Metrics**: Total Price, Total Distance, Offer Count, Min/Max Rate.

3.  **`daily_market_stats` (Long-Term Trends)**
    -   **Purpose**: Aggregates data by day for global volume analysis and 7-day trends.
    -   **Metrics**: Same as hourly, but rolled up to 24-hour periods.

### Why this method?
-   **Real-time Updates**: Triggers ensure stats are always up-to-date without needing heavy scheduled jobs.
-   **EMA for Pricing**: Freight rates fluctuate. A simple average is too slow to react, while the raw last price is too volatile. EMA provides a balanced "current market price" that smooths out noise but reacts quickly to trends.
-   **Granularity**: Storing data at Route + Body Type level allows for precise filtering.

---

## 3. Data Display (`cargobloom-web`)

The frontend is a **Next.js** application that visualizes the processed data.

### Dashboard (`dashboard-client.tsx`)
-   **Data Source**: Fetches directly from `route_stats`, `hourly_market_stats`, and `daily_market_stats`.
-   **Key Metrics Displayed**:
    -   **Price**: The `avg_rate_per_km` from `route_stats`.
    -   **Trends (1h, 24h, 7d)**: Calculated client-side by comparing the current rate against historical points in `hourly_market_stats`.
    -   **Sparklines**: Visualizes the last 24 hours of rate changes using `hourly_market_stats`.
    -   **Volume**: 24h Volume and Market Cap (estimated 7-day volume).

### Features
-   **Filtering**: Users can filter by Source (Timocom/Trans.eu), Price, Volume, and Route.
-   **Drill-down**: Clicking a route expands it to show sub-stats for specific vehicle body types (e.g., Curtain, Box, Frigo), fetched dynamically from `route_stats`.
-   **Watchlist**: Users can pin specific routes to monitor them closely.

## Summary Flow
1.  **User** browses freight exchange.
2.  **Extension** intercepts offer data.
3.  **Background Script** sends to **Supabase**.
4.  **Database Triggers** validate and aggregate data into **Stats Tables** (using EMA for rates).
5.  **Web App** queries Stats Tables to display real-time market insights.
