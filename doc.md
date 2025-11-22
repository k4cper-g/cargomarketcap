Oto kompletna **Dokumentacja Projektowa (Master Blueprint)**.

Została napisana w formacie `.md` (Markdown), zoptymalizowanym pod kątem "karmienia" innego modelu AI (Gemini/Claude/GPT-4) w edytorze Cursor. Dokument zawiera kontekst biznesowy, architekturę techniczną, schematy bazy danych oraz konkretne instrukcje implementacyjne.

Skopiuj poniższą treść, zapisz jako `PROJECT_BLUEPRINT.md` i wrzuć do Cursora.

-----

# PROJECT BLUEPRINT: Logistics Pricing Intelligence Copilot (MVP)

## 1\. Kontekst i Wizja Produktu

### Cel Biznesowy

Budujemy wtyczkę do przeglądarki Google Chrome (Manifest V3) dla spedytorów pracujących na giełdzie transportowej **Timocom**. Narzędzie działa jako "Pasywny Radar Cenowy" (Pricing Intelligence).

### Główny Problem

Spedytorzy ręcznie przeszukują setki ofert, tracąc czas na analizę stawek. Nie wiedzą, jaka jest realna cena rynkowa (Market Rate) dla danej trasy w danym momencie, przez co albo przepłacają przewoźnikom, albo oferują stawki, na które nikt nie odpowiada.

### Rozwiązanie (Core Value Proposition)

**"Invisible Analyst"**: Wtyczka w tle przechwytuje dane, które spedytor przegląda (bez aktywnego scrapowania/klikania). Analizuje surowe dane z API giełdy, wycina szum (spam/błędy) i wyświetla w Panelu Bocznym:

1.  Realną stawkę rynkową (Mediana/EMA).
2.  Trend (Ceny rosną/spadają).
3.  Listę ofert "przetłumaczoną" na czytelny format (zamiast ID).

-----

## 2\. Architektura Techniczna

### Tech Stack

  * **Frontend:** Chrome Extension (Manifest V3), Vanilla JS / HTML / CSS.
  * **Backend/Database:** Supabase (PostgreSQL + PostgREST API).
  * **Komunikacja:** `window.postMessage` (Injected -\> Content) -\> `chrome.runtime` (Content -\> Background/Sidepanel).

### Kluczowy Mechanizm: API Interception (Nie Scraping\!)

Nie parsujemy HTML (DOM). Wstrzykujemy skrypt (`injected.js`) do kontekstu strony (`MAIN world`), który nadpisuje natywną funkcję `window.fetch` oraz `XMLHttpRequest`.
Dzięki temu przechwytujemy czyste obiekty JSON przychodzące z serwera Timocom, zanim zostaną wyrenderowane.

**Kluczowe Endpointy do przechwycenia:**

1.  `freight-search-offers` (Oferty ładunków/pojazdów).
2.  `/api/currencies` (Słownik walut: ID -\> ISO Code).
3.  `/api/vehicleproperties` (Słownik nadwozi: ID -\> Label Key).
4.  `/api/translations` (Słownik tłumaczeń: Label Key -\> Tekst PL/EN).

-----

## 3\. Struktura Danych i Baza (Supabase)

### 3.1. Magazyn Lokalny (Chrome Storage)

Do szybkiego działania UI, słowniki trzymamy lokalnie.

  * `storage.local.currencies`: Mapa `{ 3: "EUR", 21: "PLN" }`
  * `storage.local.bodies`: Mapa `{ 68: "i18n...REFRIGERATOR" }`
  * `storage.local.translations`: Mapa `{ "i18n...REFRIGERATOR": "Chłodnia" }`

### 3.2. Magazyn Centralny (Supabase SQL)

Do analityki globalnej wysyłamy surowe oferty.

```sql
-- Tabela: raw_offers
CREATE TABLE raw_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_id TEXT UNIQUE NOT NULL, -- ID z Timocom (Deduplikacja)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Finanse
    price_amount NUMERIC,
    currency_id INT,
    
    -- Trasa
    distance_km NUMERIC,
    origin_country TEXT, -- ISO Code
    origin_zip TEXT,     -- Znormalizowany (np. pierwsze 2 cyfry)
    dest_country TEXT,
    dest_zip TEXT,
    
    -- Pojazd
    vehicle_body_ids JSONB, -- Tablica ID, np. [68, 45]
    
    -- Pełny zrzut (dla bezpieczeństwa/przyszłej analizy)
    full_payload JSONB
);

-- Security
ALTER TABLE raw_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for anon" ON raw_offers FOR INSERT WITH CHECK (true);
```

-----

## 4\. Logika Biznesowa (Algorytm Wyceny)

Agent nie może liczyć prostej średniej. Musi zastosować **Smart Filtering**:

1.  **Sanityzacja:** Odrzuć oferty bez ceny (`amount === 0`).
2.  **Outliers Removal (IQR):**
      * Posortuj ceny.
      * Wylicz Q1 (25%) i Q3 (75%).
      * Odrzuć wszystko poniżej `Q1 - 1.5 * IQR` i powyżej `Q3 + 1.5 * IQR`.
      * *Cel:* Usunięcie ofert "1 EUR" i "10 000 EUR".
3.  **Wskaźnik Rynkowy:**
      * Wylicz Medianę z pozostałych ofert.
      * (Opcjonalnie w v2) EMA (Exponential Moving Average) dla wykrycia trendu.

-----

## 5\. Plan Implementacji (Krok po Kroku)

### Faza 1: The Spy (Przechwytywanie Danych)

1.  Skonfiguruj `manifest.json` (permissions: `scripting`, `storage`, `sidePanel`, host: `*.timocom.com`).
2.  Stwórz `injected.js`, który robi Monkey Patch na `window.fetch`.
3.  Zaimplementuj logikę wykrywania URLi:
      * Jeśli URL zawiera `currencies` -\> wyślij event `DICT_CURRENCIES`.
      * Jeśli URL zawiera `vehicleproperties` -\> wyślij event `DICT_BODIES`.
      * Jeśli URL zawiera `translations` -\> wyślij event `DICT_TRANSLATIONS`.
      * Jeśli URL zawiera `freight-search-offers` -\> wyślij event `OFFERS_DATA`.
4.  Stwórz `content.js`, który nasłuchuje `window.onmessage` i przekazuje dane do `background.js`.

### Faza 2: The Brain (Zarządzanie Stanem)

1.  W `background.js` odbierz eventy słownikowe i zapisz je do `chrome.storage.local`.
2.  W `background.js` skonfiguruj klienta Supabase (`@supabase/supabase-js`).
3.  Po otrzymaniu `OFFERS_DATA`:
      * Zapisz paczkę ofert do `chrome.storage.local` (dla UI).
      * Wyślij asynchronicznie do Supabase (dla globalnej bazy).

### Faza 3: The UI (Panel Boczny)

1.  Stwórz `sidepanel.html` i `sidepanel.js`.
2.  Zaimplementuj funkcję `enrichOffer(offer)`:
      * Pobierz słowniki ze storage.
      * Zamień `currencyId: 3` na "EUR".
      * Zamień `bodyId: 68` na "Chłodnia" (używając łańcucha ID -\> Label -\> Translation).
3.  Wyświetl listę ofert w Panelu.
4.  Zaimplementuj logikę Mediany (z wycięciem Outlierów) i wyświetl "Sugerowaną Cenę" na górze panelu.

### Faza 4: Action (Pół-Automatyzacja)

1.  Dodaj przycisk przy wyliczonej cenie: "Kopiuj Ofertę".
2.  Wygeneruj tekst do schowka: *"Dzień dobry, w nawiązaniu do oferty [TRASA], proponuję [CENA] EUR. Płatność 45 dni."*

-----

## 6\. Wytyczne dla AI Codera (Constraints)

  * **BEZPIECZEŃSTWO:** Nie używaj żadnych metod automatycznego scrollowania, klikania w tle ani interwałów odpytujących serwer. Działamy tylko na eventach użytkownika (pasywnie).
  * **WYDAJNOŚĆ:** Nie wysyłaj każdej oferty osobno do Supabase. Używaj `upsert` dla całej tablicy (batch).
  * **DEPENDENCIES:** Używaj `supabase-js` z CDN lub lokalnego pliku, nie używaj bundlerów (Webpack/Vite) w MVP, trzymaj strukturę Vanilla JS dla czytelności.
  * **BŁĘDY:** Zawsze używaj `.clone()` na Response w `fetch` interceptorze, aby nie zepsuć działania oryginalnej strony Timocom.