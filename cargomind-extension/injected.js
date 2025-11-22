(function() {
    console.log("🚀 [Injected] Timocom/Trans.eu Interceptor loaded at", new Date().toISOString());
    console.log("🚀 [Injected] Page URL:", window.location.href);

    const originalFetch = window.fetch;
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    let interceptedCount = {
        offers: 0,
        currencies: 0,
        bodies: 0,
        translations: 0,
        countries: 0,
        additionalInfo: 0
    };

    function logStats() {
        console.log("📊 [Injected] Interception Stats:", JSON.stringify(interceptedCount));
    }

    function handleInterceptedData(url, data, source) {
        const timestamp = new Date().toISOString();

        // 1. OFERTY
        if (url.includes("freight-search-offers")) {
             const offers = data?.invocationResult?.filteredOfferRows;
             if (offers && Array.isArray(offers) && offers.length > 0) {
                interceptedCount.offers += offers.length;
                console.log(`\n🔥 [Injected] ${timestamp} - OFFERS INTERCEPTED`);
                console.log(`🔥 [Injected] Source: ${source}`);
                console.log(`🔥 [Injected] URL: ${url.substring(0, 80)}...`);
                console.log(`🔥 [Injected] Count: ${offers.length} offers`);
                console.log(`🔥 [Injected] Total intercepted: ${interceptedCount.offers}`);

                // Log sample offer structure
                if (offers[0]) {
                    console.log(`🔥 [Injected] Sample offer keys: ${Object.keys(offers[0]).join(', ')}`);
                    console.log(`🔥 [Injected] Sample publicOfferId: ${offers[0].publicOfferId || 'N/A'}`);
                    console.log(`🔥 [Injected] Sample price: ${JSON.stringify(offers[0].price || 'N/A')}`);
                }

                window.postMessage({
                    type: "OFFERS_INTERCEPTED",
                    payload: offers,
                    source: source
                }, "*");
                console.log(`🔥 [Injected] postMessage sent for OFFERS_INTERCEPTED`);
             } else {
                console.log(`⚠️ [Injected] freight-search-offers response but no offers found`);
                console.log(`⚠️ [Injected] Data structure: ${data ? Object.keys(data).join(', ') : 'null'}`);
                if (data?.invocationResult) {
                    console.log(`⚠️ [Injected] invocationResult keys: ${Object.keys(data.invocationResult).join(', ')}`);
                }
             }
        }
        // 2. SŁOWNIKI (Waluty)
        else if (url.includes("/api/currencies") || url.includes("geolocale/currency")) {
            interceptedCount.currencies++;
            console.log(`💰 [Injected] ${timestamp} - Currencies intercepted from ${source}`);
             window.postMessage({
                type: "DICT_CURRENCIES",
                payload: data,
                source: source
            }, "*");
        }
        // 3. SŁOWNIKI (Nadwozia)
        else if (url.includes("/api/vehicleproperties") || url.includes("vehiclepropertygroup")) {
            interceptedCount.bodies++;
            console.log(`🚛 [Injected] ${timestamp} - Vehicle bodies intercepted from ${source}`);
             window.postMessage({
                type: "DICT_BODIES",
                payload: data,
                source: source
            }, "*");
        }
        // 4. SŁOWNIKI (Tłumaczenia)
        else if (url.includes("/api/translations")) {
            interceptedCount.translations++;
            console.log(`📝 [Injected] ${timestamp} - Translations intercepted from ${source}`);
             window.postMessage({
                type: "DICT_TRANSLATIONS",
                payload: data,
                source: source
            }, "*");
        }
        // 5. SŁOWNIKI (Kraje)
        else if (url.includes("/api/countries") || url.includes("geolocale/country")) {
            interceptedCount.countries++;
            console.log(`🌍 [Injected] ${timestamp} - Countries intercepted from ${source}`);
             window.postMessage({
                type: "DICT_COUNTRIES",
                payload: data,
                source: source
            }, "*");
        }
        // 6. SŁOWNIKI (Dodatkowe Info)
        else if (url.includes("additional-infos") || url.includes("additionalinfos")) {
            interceptedCount.additionalInfo++;
            console.log(`ℹ️ [Injected] ${timestamp} - Additional info intercepted from ${source}`);
             window.postMessage({
                type: "DICT_ADDITIONAL_INFO",
                payload: data,
                source: source
            }, "*");
        }
    }

    // 1. Intercept Fetch
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] ? args[0].toString() : "";

        // Only log relevant URLs
        const isRelevant = url.includes("freight-search-offers") ||
                          url.includes("/api/currencies") ||
                          url.includes("geolocale/currency") ||
                          url.includes("/api/vehicleproperties") ||
                          url.includes("vehiclepropertygroup") ||
                          url.includes("/api/translations") ||
                          url.includes("/api/countries") ||
                          url.includes("geolocale/country") ||
                          url.includes("additional-infos") ||
                          url.includes("additionalinfos");

        if (isRelevant) {
            console.log(`🌐 [Injected/Fetch] Intercepted: ${url.substring(0, 60)}...`);
        }

        const clone = response.clone();
        clone.json().then(data => {
            handleInterceptedData(url, data, "fetch");
        }).catch(err => {
             // Ignorujemy błędy parsowania (non-JSON responses)
        });

        return response;
    };

    // 2. Intercept XHR
    XMLHttpRequest.prototype.open = function(method, url) {
        // Ensure _url is always a string (URL can be a URL object)
        this._url = typeof url === 'string' ? url : url?.toString?.() || '';
        return originalXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
            // Safety check: ensure _url is a string
            const urlStr = typeof this._url === 'string' ? this._url : (this._url?.toString?.() || '');
            if (urlStr) {
                const isRelevant = urlStr.includes("freight-search-offers") ||
                                  urlStr.includes("/api/currencies") ||
                                  urlStr.includes("geolocale/currency") ||
                                  urlStr.includes("/api/vehicleproperties") ||
                                  urlStr.includes("vehiclepropertygroup") ||
                                  urlStr.includes("/api/translations") ||
                                  urlStr.includes("/api/countries") ||
                                  urlStr.includes("geolocale/country") ||
                                  urlStr.includes("additional-infos") ||
                                  urlStr.includes("additionalinfos");

                if (isRelevant) {
                    console.log(`🌐 [Injected/XHR] Intercepted: ${urlStr.substring(0, 60)}...`);
                }

                 try {
                    const data = JSON.parse(this.responseText);
                    handleInterceptedData(urlStr, data, "xhr");
                } catch (e) {
                    if (isRelevant) {
                        console.warn(`⚠️ [Injected/XHR] Failed to parse JSON for: ${urlStr.substring(0, 60)}...`);
                    }
                }
            }
        });
        return originalXhrSend.apply(this, arguments);
    };

    console.log("🚀 [Injected] Fetch and XHR interceptors installed successfully");

    // Log stats every 30 seconds
    setInterval(logStats, 30000);

})();