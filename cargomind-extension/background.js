// background.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

console.log("🧠 Background Service Worker Started (Module Mode)");
console.log(`🔧 [Config] SUPABASE_URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`🔧 [Config] SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '***' + SUPABASE_ANON_KEY.slice(-8) : 'NOT SET'}`);

// --- STATE ---
let lastBatchHash = "";
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 5000;
let totalSyncAttempts = 0;
let totalSyncSuccesses = 0;
let totalSyncFailures = 0; 

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function calculateBatchHash(offers) {
    if (!offers || offers.length === 0) return "";
    const sample = [
        ...offers.slice(0, 3), 
        ...offers.slice(-3)
    ];
    const ids = sample.map(o => o.publicOfferId || o.id || "no-id").join(",");
    return `${offers.length}|${ids}`;
}

// Generyczna funkcja do wysyłania słowników
async function syncDictionaryToSupabase(type, data) {
    if (!SUPABASE_URL || !data || !Array.isArray(data)) return;
    
    console.log(`📚 [Supabase] Syncing Dictionary: ${type}`);

    let itemsToSync = data;

    if (type === 'body_type') {
        if (data.length > 0 && data[0].propertyModelList) {
            console.log("🔧 Flattening Vehicle Properties groups...");
            itemsToSync = data.flatMap(group => group.propertyModelList || []);
        }
    }

    console.log(`   -> Flattened items count: ${itemsToSync.length}`);

    const rows = itemsToSync.map(item => ({
        type: type,
        external_id: item.id,
        code: item.isoCode || item.labelKey || item.text || (item.i18nLabel ? item.i18nLabel.split('.').pop() : null), 
        label: item.i18nLabel || item.label || null,
        payload: item
    }));

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/dictionaries?on_conflict=type,external_id`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(rows)
        });

        if (!response.ok) {
            console.error(`❌ [Supabase] Dict Sync Failed: ${response.status}`);
        } else {
            console.log(`✅ [Supabase] Dict ${type} Synced!`);
        }
    } catch (err) {
        console.error("❌ [Supabase] Network Error (Dict):", err);
    }
}

async function syncToSupabase(offers) {
    totalSyncAttempts++;
    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    console.log(`\n========== SYNC ATTEMPT #${totalSyncAttempts} [${syncId}] ==========`);
    console.log(`📊 [Stats] Success: ${totalSyncSuccesses} | Failures: ${totalSyncFailures}`);
    console.log(`📦 [Input] Received ${offers?.length || 0} offers`);

    if (!offers || offers.length === 0) {
        console.log("⚠️ [Supabase] No offers to sync");
        return;
    }

    if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR_SUPABASE")) {
        console.error("❌ [Supabase] SUPABASE_URL not configured properly!");
        console.error(`   Current value: ${SUPABASE_URL}`);
        totalSyncFailures++;
        return;
    }

    // 1. Rate Limiting
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
        console.log(`⏳ [Supabase] Skipping sync (Rate Limit) - ${timeSinceLastSync}ms since last sync, need ${MIN_SYNC_INTERVAL}ms`);
        return;
    }

    // 2. Deduplikacja
    const currentHash = calculateBatchHash(offers);
    console.log(`🔑 [Hash] Current: ${currentHash}`);
    console.log(`🔑 [Hash] Previous: ${lastBatchHash}`);
    if (currentHash === lastBatchHash) {
        console.log("♻️ [Supabase] Skipping sync (Duplicate Batch)");
        return;
    }

    lastSyncTime = now;
    lastBatchHash = currentHash;

    console.log(`☁️ [Supabase] Syncing batch of ${offers.length} offers...`);

    // Log sample offer structure for debugging
    if (offers.length > 0) {
        const sample = offers[0];
        console.log(`📋 [Sample Offer] Keys: ${Object.keys(sample).join(', ')}`);
        console.log(`📋 [Sample Offer] publicOfferId: ${sample.publicOfferId || 'N/A'}`);
        console.log(`📋 [Sample Offer] price: ${JSON.stringify(sample.price || 'N/A')}`);
        console.log(`📋 [Sample Offer] distanceInMeters: ${sample.distanceInMeters || 'N/A'}`);
        console.log(`📋 [Sample Offer] vehicleBodyIds: ${JSON.stringify(sample.vehicleBodyIds || 'N/A')}`);
    }

    const rows = offers.map(o => {
        let priceAmount = null;
        let currencyId = null;
        if (o.price) {
            priceAmount = (o.price.amount !== undefined && o.price.amount !== null) ? o.price.amount : null;
            currencyId = (o.price.currencyId !== undefined && o.price.currencyId !== null) ? o.price.currencyId : null;
        } else {
            priceAmount = (o.amount !== undefined && o.amount !== null) ? o.amount : null;
            currencyId = (o.currencyId !== undefined && o.currencyId !== null) ? o.currencyId : null;
        }

        let originZip = null;
        let originCountry = "UNKNOWN"; 
        let destZip = null;
        let destCountry = "UNKNOWN"; 

        if (o.loadingplaces && Array.isArray(o.loadingplaces)) {
            const load = o.loadingplaces.find(lp => lp.loadingType === "LOADING") || o.loadingplaces[0];
            const unload = [...o.loadingplaces].reverse().find(lp => lp.loadingType === "UNLOADING") || o.loadingplaces[o.loadingplaces.length - 1];
            
            if (load && load.address) {
                originZip = load.address.zipCode || null;
                if (load.address.countryId) originCountry = String(load.address.countryId);
            }
            if (unload && unload.address) {
                destZip = unload.address.zipCode || null;
                if (unload.address.countryId) destCountry = String(unload.address.countryId);
            }
        }

        const uniqueId = o.publicOfferId || o.id || `generated-${generateUUID()}`;

        return {
            original_id: uniqueId,
            price_amount: priceAmount,
            currency_id: currencyId,
            distance_km: (o.distanceInMeters !== undefined && o.distanceInMeters !== null) ? o.distanceInMeters / 1000 : null,
            origin_zip: originZip,
            origin_country: originCountry,
            dest_zip: destZip,
            dest_country: destCountry,
            vehicle_body_ids: o.vehicleBodyIds || [],
            full_payload: o || {}
        };
    });

    // Log prepared data summary
    const validRows = rows.filter(r => r.price_amount !== null && r.distance_km !== null);
    const invalidRows = rows.filter(r => r.price_amount === null || r.distance_km === null);
    console.log(`📝 [Prepared] Total: ${rows.length} | Valid (with price & distance): ${validRows.length} | Invalid: ${invalidRows.length}`);

    if (rows.length > 0) {
        console.log(`📝 [Sample Row] ${JSON.stringify(rows[0])}`);
    }

    if (invalidRows.length > 0) {
        console.log(`⚠️ [Invalid Rows] First invalid: ${JSON.stringify(invalidRows[0])}`);
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/raw_offers?on_conflict=original_id`;
    console.log(`🌐 [Request] POST ${endpoint}`);

    try {
        const startTime = performance.now();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(rows)
        });
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        console.log(`⏱️ [Response] Status: ${response.status} ${response.statusText} (${duration}ms)`);
        console.log(`⏱️ [Response] Headers: content-type=${response.headers.get('content-type')}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Supabase] Sync Failed: ${response.status}`);
            console.error(`❌ [Supabase] Error Details: ${errorText}`);
            console.error(`❌ [Supabase] Request body size: ${JSON.stringify(rows).length} bytes`);
            totalSyncFailures++;
        } else {
            const responseText = await response.text();
            console.log(`✅ [Supabase] Sync Success! Response: ${responseText || '(empty)'}`);
            console.log(`✅ [Supabase] Synced ${rows.length} offers at ${new Date().toISOString()}`);
            totalSyncSuccesses++;
        }
    } catch (err) {
        console.error("❌ [Supabase] Network Error:", err);
        console.error(`❌ [Supabase] Error type: ${err.name}`);
        console.error(`❌ [Supabase] Error message: ${err.message}`);
        totalSyncFailures++;
    }
    console.log(`========== END SYNC [${syncId}] ==========\n`);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [Message Received] ${timestamp}`);
    console.log(`📨 [Message Type] ${message?.type || 'UNKNOWN'}`);
    console.log(`📨 [Message Source] Tab: ${sender?.tab?.id || 'N/A'} | URL: ${sender?.tab?.url?.substring(0, 50) || 'N/A'}...`);
    console.log(`📨 [Message Payload] ${message?.payload ? `Array of ${message.payload.length} items` : 'No payload'}`);

    // Obsługa asynchroniczna
    (async () => {
        try {
            switch (message.type) {
                case "OFFERS_INTERCEPTED":
                    console.log(`🎯 [Handler] Processing OFFERS_INTERCEPTED`);
                    await syncToSupabase(message.payload);
                    break;
                case "DICT_CURRENCIES":
                    console.log(`🎯 [Handler] Processing DICT_CURRENCIES`);
                    await syncDictionaryToSupabase("currency", message.payload);
                    break;
                case "DICT_BODIES":
                    console.log(`🎯 [Handler] Processing DICT_BODIES`);
                    await syncDictionaryToSupabase("body_type", message.payload);
                    break;
                case "DICT_COUNTRIES":
                    console.log(`🎯 [Handler] Processing DICT_COUNTRIES`);
                    await syncDictionaryToSupabase("country", message.payload);
                    break;
                case "DICT_ADDITIONAL_INFO":
                    console.log(`🎯 [Handler] Processing DICT_ADDITIONAL_INFO`);
                    await syncDictionaryToSupabase("additional_info", message.payload);
                    break;
                default:
                    console.log(`⚠️ [Handler] Unknown message type: ${message.type}`);
            }
            // Send response after processing completes
            sendResponse({ success: true });
        } catch (err) {
            console.error(`❌ [Handler] Error processing ${message.type}:`, err);
            sendResponse({ success: false, error: err.message });
        }
    })();

    // Return true to indicate we'll send response asynchronously
    return true;
});

// Keep-alive for service worker
chrome.runtime.onConnect.addListener((port) => {
    console.log("🔌 [Background] Content script connected");
    port.onDisconnect.addListener(() => {
        console.log("🔌 [Background] Content script disconnected");
    });
});