## OpenMeteo Weather Tap – Design Spec

Goal: Provide a plug-replaceable Weather Tap for the demo that fetches real weather from Open‑Meteo without an API key. Use Grip to compose small taps (geocoding → weather), keep async flows cancelable and cacheable, and avoid leaking contexts/drips when tabs are flipped rapidly.

Non-goals: Modify core library behavior. We’ll build taps within the demo; if we discover generalizable patterns, we’ll propose core helpers later (e.g., async tap adapters).

---

### External Services (no API key)

- Geocoding: Open‑Meteo Geocoding API
  - `GET https://geocoding-api.open-meteo.com/v1/search?name={q}&count=1&language=en&format=json`
  - Response: `results[0].latitude`, `results[0].longitude`, `name`, `country_code`, etc.

- Weather: Open‑Meteo Forecast API
  - `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,cloudcover,uv_index,winddirection_10m,windspeed_10m`
  - Current: `current_weather.temperature`, `current_weather.windspeed`, `current_weather.winddirection`
  - Hourly (pick nearest/current hour): `relativehumidity_2m`, `precipitation_probability`, `cloudcover`, `uv_index`

---

### Plug‑Replace Requirements

- Keep existing consumer grips unchanged so the UI works without edits:
  - `WEATHER_TEMP_C`, `WEATHER_HUMIDITY`, `WEATHER_WIND_SPEED`, `WEATHER_WIND_DIR`,
    `WEATHER_RAIN_PCT`, `WEATHER_SUNNY_PCT`, `WEATHER_UV_INDEX`
  - `WEATHER_LOCATION` (string) and `WEATHER_LOCATION_TAP` (handle) remain the same.

- New taps must attach in the same child context used by `WeatherColumn` so scoping is per column.

---

### Proposed Grips (demo)

- Inputs (existing):
  - `WEATHER_LOCATION: string` (e.g., "Sydney") – destination param for geocoding

- Intermediate (new in demo):
  - `GEO_LAT: number`, `GEO_LON: number` – produced by geocoding tap
  - Optional display: `GEO_LABEL: string` (canonicalized city, country)

- Outputs (unchanged):
  - `WEATHER_TEMP_C: number`
  - `WEATHER_HUMIDITY: number` (0..100)
  - `WEATHER_WIND_SPEED: number` (kph)
  - `WEATHER_WIND_DIR: number` (deg)
  - `WEATHER_RAIN_PCT: number` (0..100)
  - `WEATHER_SUNNY_PCT: number` (derived = 100 - cloudcover)
  - `WEATHER_UV_INDEX: number`

- Optional diagnostics (demo only):
  - `WEATHER_LOADING: boolean`, `WEATHER_ERROR: string` (not required by current UI)

---

### Tap Composition

1) LocationToGeoTap (Geocoding)
   - Provides: `GEO_LAT`, `GEO_LON`, optionally `GEO_LABEL`
   - Destination params: `[WEATHER_LOCATION]`
   - Behavior:
     - When `WEATHER_LOCATION` changes (per destination context), debounce (e.g., 250ms) and fetch geocoding.
     - On success: publish lat/lon (and label) to the destination.
     - On failure: clear lat/lon to `undefined` and optionally publish `WEATHER_ERROR`.
     - Cancellation: abort in‑flight fetch when location changes/unmounts.
     - Caching: in‑memory LRU by `location.toLowerCase()` with TTL (e.g., 30m).

2) OpenMeteoWeatherTap (Forecast)
   - Provides: `WEATHER_TEMP_C`, `WEATHER_HUMIDITY`, `WEATHER_WIND_SPEED`, `WEATHER_WIND_DIR`, `WEATHER_RAIN_PCT`, `WEATHER_SUNNY_PCT`, `WEATHER_UV_INDEX`
   - Destination params: `[GEO_LAT, GEO_LON]`
   - Behavior:
     - When lat/lon present: fetch current + hourly fields once; compute derived fields and publish.
     - Current hour selection: pick the hour index matching `current_weather.time` or nearest.
     - Derived mappings:
       - TempC = `current_weather.temperature`
       - WindSpeed = `current_weather.windspeed`
       - WindDir = `current_weather.winddirection`
       - Humidity = `hourly.relativehumidity_2m[idx]`
       - RainPct = `hourly.precipitation_probability[idx]`
       - SunnyPct = `100 - hourly.cloudcover[idx]`
       - UV = `hourly.uv_index[idx]`
     - Cancellation: abort in‑flight fetch when lat/lon changes/unmounts.
     - Caching: in‑memory LRU by `{lat,lon}` rounded to 3–4 decimals with TTL (e.g., 5–10m).

Notes
- Both taps attach once at their home context and react to destination params via Grip destination semantics. No polling; re-fetch only on param changes.

---

### Async & Cancellation Strategy

- Store an `AbortController` per destination context key (e.g., by context key registry id from dumper or by `ctx.id`).
- On param change for that destination: abort previous controller, create a new one.
- Debounce geocoding to avoid flurries while typing; weather fetch can go immediately after lat/lon resolves.

---

### Caching Strategy

- Shared maps per tap instance (module‑level or instance field):
  - Geocoding cache: `Map<string /*lowercased name*/, {lat:number, lon:number, label:string, expiresAt:number}>`
  - Weather cache: `Map<string /*lat:lon rounded*/, {payload:any, expiresAt:number}>`
- TTL checks on read; periodic soft cleanup on writes. Keep sizes modest (e.g., 200 items).

---

### Error/Loading Semantics (optional)

- If used, publish `WEATHER_LOADING=true` upon request start, `false` on finish.
- On fetch errors or empty geocoding results: publish `WEATHER_ERROR` with message; set outputs to `undefined`.
- Current UI does not depend on these; they’re optional enhancements.

---

### Performance & Limits

- No API key → rely on client‑side limits; debounce reduces churn.
- Round lat/lon keys to reduce cache fragmentation.
- Avoid re-fetch if cached entry is fresh; publish synchronously from cache.

---

### Integration in Demo

- Keep `WEATHER_LOCATION_TAP` as is (simple value handle).
- Register two new taps in the same child context where `WeatherColumn` creates the location tap:
  1) `LocationToGeoTap` (consumes `WEATHER_LOCATION`) → publishes `GEO_LAT`, `GEO_LON`
  2) `OpenMeteoWeatherTap` (consumes `GEO_LAT/LON`) → publishes weather grips used by UI
- Because UI reads existing output grips, switching to OpenMeteo is plug‑replaceable.

---

### Extensibility / Future Core Helpers

- Promise→Tap adapter: ergonomic wrapper to turn an async function `(params) => Promise<result>` into a destination‑param‑driven tap with built‑in caching, debouncing, and cancellation.
- Interruptible flow manager: utility to coordinate multi‑stage async chains (geocode → weather), ensuring only the latest request per destination wins.
- DebounceTap: generic tap that debounces destination param drips before downstream taps observe them.

---

### Testing Plan

- Unit: mock fetch to return known geocoding and weather payloads; verify correct mapping to output grips and proper cancellation on param changes.
- Integration: wire in the demo, set location to well‑known cities (Sydney, Paris), verify outputs and that rapid flips don’t leak contexts (use the graph dump tool).
- Cache tests: first call hits fetch, second hits cache; TTL expiry triggers refresh.

---

### Implementation Notes

- Keep tap classes small: one class per responsibility (geocode, weather).
- Encapsulate caching and abort‑controller management inside each tap; avoid `enum`/switch in favor of small helpers.
- Use the engine’s task queue for micro‑batching if needed (e.g., coalescing rapid param changes).
- Strictly no mutation of consumer UI state from taps; only publish via Grip.


