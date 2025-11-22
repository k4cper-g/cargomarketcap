// content.js
console.log("🔌 [Content Script] Loaded at", new Date().toISOString());
console.log("🔌 [Content Script] URL:", window.location.href);

// Keep-alive connection
let port = null;
function connectToBackground() {
    try {
        port = chrome.runtime.connect({ name: "content-script" });
        port.onDisconnect.addListener(() => {
            console.log("🔌 [Content Script] Disconnected from background");
            port = null;
            // Try to reconnect after a delay
            setTimeout(connectToBackground, 1000);
        });
        console.log("🔌 [Content Script] Connected to background");
    } catch (e) {
        console.log("🔌 [Content Script] Connection failed:", e);
    }
}
connectToBackground();

const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function() {
    console.log("🔌 [Content Script] Injected.js loaded successfully");
    this.remove();
};
s.onerror = function(err) {
    console.error("🔌 [Content Script] Failed to load injected.js:", err);
};
(document.head || document.documentElement).appendChild(s);

let messageCount = 0;

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  const validTypes = [
      "OFFERS_INTERCEPTED",
      "DICT_CURRENCIES",
      "DICT_BODIES",
      "DICT_TRANSLATIONS",
      "DICT_COUNTRIES",
      "DICT_ADDITIONAL_INFO"
  ];

  if (event.data && validTypes.includes(event.data.type)) {
    messageCount++;
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [Content Script] Message #${messageCount} at ${timestamp}`);
    console.log(`📨 [Content Script] Type: ${event.data.type}`);
    console.log(`📨 [Content Script] Payload size: ${event.data.payload?.length || 0} items`);
    console.log(`📨 [Content Script] Source: ${event.data.source || 'unknown'}`);

    // Bezpieczne wysyłanie wiadomości
    if (chrome.runtime && chrome.runtime.id) {
        console.log(`📨 [Content Script] Runtime ID: ${chrome.runtime.id}`);
        try {
            chrome.runtime.sendMessage(event.data)
                .then((response) => {
                    if (response?.success) {
                        console.log(`✅ [Content Script] Message ${event.data.type} processed successfully`);
                    } else if (response?.error) {
                        console.warn(`⚠️ [Content Script] Message ${event.data.type} processed with error:`, response.error);
                    } else {
                        console.log(`✅ [Content Script] Message ${event.data.type} sent`);
                    }
                })
                .catch(err => {
                    // Cicha obsługa typowych błędów połączenia
                    const msg = err.message || "";
                    console.error(`❌ [Content Script] Failed to send ${event.data.type}:`, msg);
                    if (msg.includes("Extension context invalidated")) {
                        console.warn("⚠️ Extension context invalidated. Attempting to reload content script...");
                        // Jeśli kontekst jest nieważny, odświeżenie strony to jedyny pewny sposób
                        // Ale możemy spróbować mniej inwazyjnej metody, jeśli to tylko zerwane połączenie
                        window.location.reload();
                    } else if (msg.includes("Receiving end does not exist")) {
                        console.warn("⚠️ Background script not running. Extension may need reload.");
                    } else {
                        console.debug("Background connection error:", err);
                    }
                });
        } catch (e) {
            // Łapie błędy synchroniczne, jeśli runtime już nie istnieje
            console.error("❌ [Content Script] Sync error:", e);
            console.warn("⚠️ Extension context lost. Reloading page to restore context...");
            window.location.reload();
        }
    } else {
        // This is normal after extension reload - just need to refresh the page
        console.debug("🔄 [Content Script] Extension context stale - reloading page...");
        window.location.reload();
    }
  }
});

console.log("🔌 [Content Script] Message listener registered");