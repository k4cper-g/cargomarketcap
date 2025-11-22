# CargoMind: Technical Architecture & Documentation

## 1. System Overview
CargoMind is a **Passive Pricing Intelligence System** for the logistics industry. It operates as a Chrome Extension that intercepts network traffic from major freight exchange platforms (e.g., Timocom) to build a real-time, crowdsourced database of market rates.

### Core Philosophy
- **Passive Sniffing:** No active scraping. The system only sees what the user naturally browses. Zero risk of detection.
- **Multi-Facet Analytics:** One offer often matches multiple vehicle types. We process each offer against ALL compatible vehicle types to build precise benchmarks.
- **Cloud-Native:** Logic resides in Supabase (PostgreSQL), utilizing Triggers for Real-time ETL.

---

## 2. Data Flow Pipeline

1.  **Interception (Client-Side)**
    - `injected.js` monkey-patches `window.fetch` and `XMLHttpRequest`.
    - Captures: `freight-search-offers` (payloads), `api/currencies` & `api/vehicleproperties` (dictionaries).
    - Forwards data to `background.js` via `window.postMessage`.

2.  **Processing (Background Service Worker)**
    - **Deduplication:** Calculates hash of offer batches to prevent duplicate uploads.
    - **Rate Limiting:** Throttles syncs (max 1 per 5s) to protect bandwidth.
    - **Sync:** Pushes raw JSONs directly to `raw_offers` and `dictionaries`.

3.  **Storage & Aggregation (Supabase SQL - The Brain)**
    - **Raw Data Lake:** `raw_offers` table stores every single intercepted offer (JSONB).
    - **Automatic Classification:** SQL Triggers decode vehicle IDs using `dictionaries`.
    - **Multi-Stat Generation:** A single offer (e.g., suitable for both `TAUTLINER` and `MEGA`) updates statistics for:
        - `TAUTLINER`
        - `MEGA`
        - `ALL` (General Market Benchmark)
    - **Real-time ETL:** `route_stats` (Fast Cache with EMA) and `daily_market_stats` (Historical) are updated instantly on insert.

---

## 3. Database Schema (Key Components)

### `raw_offers`
Immutable log of all market events. Pure Data Lake.
- `original_id` (Unique ID from exchange)
- `price_amount`, `distance_km`
- `origin_country`, `dest_country`
- `vehicle_body_ids` (JSON Array of IDs)
- `full_payload` (Complete JSON dump)

### `dictionaries`
The Decoder Ring.
- Maps Exchange IDs (e.g., `46`) to Human Readable Codes (e.g., `THERMO`, `SWAP_BODY`).
- Used by SQL functions to tag offers dynamically.

### `route_stats` (The "Hot" Cache)
The "Pulse" of the market. Optimized for sub-millisecond reads.
- **Granularity:** Per Route (PL->DE) AND Per specific Body Type (incl. 'ALL').
- **Logic:** Exponential Moving Average (EMA). Reacts quickly to market changes.
- **Usage:** Instant "Good/Bad Price" evaluation in the UI.

### `daily_market_stats` (The "Cold" Storage)
The "Memory" of the market.
- **Granularity:** Daily summary per Route & Body Type.
- **Logic:** Weighted Average (Arithmetic). Precise historical data.
- **Usage:** Trend charts, weekly analysis, "Skyscanner" price history.

---

## 4. Advanced Analytics ("Skyscanner" Model)

We implement a **"One-to-Many"** analytical model.
- If a freight offer allows multiple vehicle types (e.g., Box, Curtain, Mega), it is counted towards statistics for **each** of those types.
- This allows us to calculate **Price Spreads**:
    - *"Market Average for Route X is 1.20€"*
    - *"Your Fridge Truck can get 1.50€"*
    - *"Spread: +0.30€"*

This architecture provides the foundation for:
1.  **Market Transparency:** Showing the "General" price vs. "Specific" price.
2.  **Opportunity Detection:** Highlighting routes where specific equipment pays significantly better than generic.
