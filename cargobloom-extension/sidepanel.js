import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let countryMap = {};

async function fetchFromSupabase(table, query = '') {
    if (!SUPABASE_URL) return null;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
    } catch (err) {
        console.error(`Error fetching ${table}:`, err);
        return [];
    }
}

async function loadDictionaries() {
    const data = await fetchFromSupabase('dictionaries', 'type=eq.country&select=external_id,code');
    if (data) {
        data.forEach(d => {
            countryMap[d.external_id] = d.code;
        });
    }
}

function getCountryCode(id) {
    return countryMap[id] || id || "?";
}

// Funkcja mapująca grupę na ikonę
function getGroupIcon(group) {
    switch (group) {
        case 'TEMP': return '❄️'; // Chłodnia
        case 'EXPRESS': return '⚡'; // Bus
        default: return '🚛'; // General
    }
}

async function loadStats() {
    const listEl = document.getElementById('stats-list');
    listEl.innerHTML = '<li class="loading">Analiza segmentów rynku...</li>';

    if (Object.keys(countryMap).length === 0) {
        await loadDictionaries();
    }

    // 1. Pobierz Historię (EMA) z uwzględnieniem body_group
    const historyData = await fetchFromSupabase('route_stats', 'order=last_updated.desc&limit=50');
    
    // 2. Pobierz Live (4h snapshot) z uwzględnieniem body_group
    const liveData = await fetchFromSupabase('live_market_snapshot', '');

    // Mapa Live: "PL-DE-GENERAL" -> { rate, volume }
    const liveMap = {};
    if (liveData) {
        liveData.forEach(row => {
            const key = `${row.origin_country}-${row.dest_country}-${row.body_group}`;
            liveMap[key] = row;
        });
    }

    listEl.innerHTML = '';

    if (!historyData || historyData.length === 0) {
        listEl.innerHTML = '<li class="loading">Brak danych historycznych.</li>';
        return;
    }

    historyData.forEach(hist => {
        const group = hist.body_group || 'GENERAL';
        const key = `${hist.origin_country}-${hist.dest_country}-${group}`;
        const live = liveMap[key];
        
        const origin = getCountryCode(hist.origin_country);
        const dest = getCountryCode(hist.dest_country);
        const icon = getGroupIcon(group);
        
        let displayRate = 0;
        let isLive = false;
        let volume = 0;

        if (live && live.volume > 3) {
            displayRate = live.live_rate;
            volume = live.volume;
            isLive = true;
        } else {
            displayRate = hist.ema_rate_per_km;
            volume = hist.offers_count; 
            isLive = false;
        }

        const rateFormatted = Number(displayRate).toFixed(2);
        const rateClass = isLive ? "rate-live" : "rate-history";
        const badge = isLive ? '<span class="badge-live">LIVE</span>' : '<span class="badge-hist">HIST</span>';
        const volLabel = isLive ? `(4h: ${volume})` : `(Tot: ${volume})`;

        const li = document.createElement('li');
        li.className = 'route-card';
        li.innerHTML = `
            <div class="route-header">
                <span>${origin} &rarr; ${dest} <span style="font-size:12px; margin-left:4px" title="${group}">${icon}</span></span>
                ${badge}
            </div>
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: baseline;">
                <span class="rate-value ${rateClass}">${rateFormatted} €/km</span>
                <span class="meta-info">${volLabel}</span>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// Style już są w HTML lub dodane dynamicznie wcześniej, ale dla pewności:
if (!document.getElementById('dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.innerHTML = `
        .badge-live { background: #d3f9d8; color: #2b8a3e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-hist { background: #f1f3f5; color: #868e96; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .rate-live { color: #2b8a3e; } 
        .rate-history { color: #495057; }
    `;
    document.head.appendChild(style);
}

document.getElementById('btn-refresh').addEventListener('click', loadStats);

loadStats();
