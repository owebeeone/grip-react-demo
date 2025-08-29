import { type Tap, createAsyncMultiTap } from '@owebeeone/grip-react';
import type { Grip, TapFactory } from '@owebeeone/grip-react';
import { GEO_LAT, GEO_LNG, GEO_LABEL, WEATHER_HUMIDITY, WEATHER_LOCATION, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_TEMP_C, WEATHER_UV_INDEX, WEATHER_WIND_DIR, WEATHER_WIND_SPEED } from './grips.weather';

function toCompass(deg: number | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const ix = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[ix];
}

function nearestHourIndex(hourlyTimes: string[], currentIso: string): number {
  const idxEqual = hourlyTimes.indexOf(currentIso);
  if (idxEqual >= 0) return idxEqual;
  const currentMs = Date.parse(currentIso);
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const d = Math.abs(Date.parse(hourlyTimes[i]) - currentMs);
    if (d < bestDelta) { best = i; bestDelta = d; }
  }
  return best;
}

export function createLocationToGeoTap(): Tap {
  type Outs = { Lat: typeof GEO_LAT; Lng: typeof GEO_LNG; Label: typeof GEO_LABEL };
  return createAsyncMultiTap<Outs, { lat?: number; lng?: number; label?: string }>({
    provides: [GEO_LAT, GEO_LNG, GEO_LABEL],
    destinationParamGrips: [WEATHER_LOCATION],
    cacheTtlMs: 30 * 60 * 1000,
    deadlineMs: 5000,
    requestKeyOf: (params) => {
      const key = (params.get(WEATHER_LOCATION) ?? '').toString().trim().toLowerCase() || undefined;
      console.log(`[LocationToGeoTap] requestKeyOf for ${params.destContext.id}: ${key}`);
      return key;
    },
    fetcher: async (params, signal) => {
      const q = (params.get(WEATHER_LOCATION) ?? '').toString().trim();
      console.log(`[LocationToGeoTap] fetcher: Fetching geo data for "${q}" in ${params.destContext.id}`);
      if (!q) return { lat: undefined, lng: undefined, label: '' };
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
      const res = await fetch(url, { signal });
      if (!res.ok) return { lat: undefined, lng: undefined, label: '' };
      const data: any = await res.json();
      const r = data?.results?.[0];
      if (!r) return { lat: undefined, lng: undefined, label: '' };
      return { lat: r.latitude as number, lng: r.longitude as number, label: String(r.name ?? q) };
    },
    mapResult: (_params, r) => new Map<Grip<any>, any>([
      [GEO_LAT as unknown as Grip<any>, r.lat],
      [GEO_LNG as unknown as Grip<any>, r.lng],
      [GEO_LABEL as unknown as Grip<any>, r.label ?? ''],
    ])
  });
}

export const PROVIDES = [
  WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR,
  WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX
];

// @ts-ignore
export function createOpenMeteoWeatherTap(): Tap {
  type Outs = {
    T: typeof WEATHER_TEMP_C;
    H: typeof WEATHER_HUMIDITY;
    WS: typeof WEATHER_WIND_SPEED;
    WD: typeof WEATHER_WIND_DIR;
    RP: typeof WEATHER_RAIN_PCT;
    SP: typeof WEATHER_SUNNY_PCT;
    UV: typeof WEATHER_UV_INDEX;
  };
  const tap = createAsyncMultiTap<Outs, any>({
    provides: PROVIDES,
    destinationParamGrips: [GEO_LAT, GEO_LNG],
    cacheTtlMs: 10 * 60 * 1000,
    deadlineMs: 7000,
    requestKeyOf: (params) => {
      const lat = params.get(GEO_LAT);
      const lng = params.get(GEO_LNG);
      if (lat == null || lng == null) {
        console.log(`[OpenMeteoWeatherTap] requestKeyOf for ${params.destContext.id}: undefined (lat/lng missing)`);
        return undefined;
      }
      const rl = Math.round((lat as number) * 10000) / 10000;
      const rg = Math.round((lng as number) * 10000) / 10000;
      const key = `${rl}:${rg}`;
      console.log(`[OpenMeteoWeatherTap] requestKeyOf for ${params.destContext.id}: ${key}`);
      return key;
    },
    fetcher: async (params, signal) => {
      const lat = params.get(GEO_LAT);
      const lng = params.get(GEO_LNG);
      console.log(`[OpenMeteoWeatherTap] fetcher: Fetching weather for lat=${lat}, lng=${lng} in ${params.destContext.id}`);
      if (lat == null || lng == null) return null;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,cloudcover,uv_index,winddirection_10m,windspeed_10m`;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;
      return await res.json();
    },
    mapResult: (_params, data) => {
      const updates = new Map<Grip<any>, any>();
      if (!data) {
        updates.set(WEATHER_TEMP_C as any, undefined);
        updates.set(WEATHER_HUMIDITY as any, undefined);
        updates.set(WEATHER_WIND_SPEED as any, undefined);
        updates.set(WEATHER_WIND_DIR as any, '');
        updates.set(WEATHER_RAIN_PCT as any, undefined);
        updates.set(WEATHER_SUNNY_PCT as any, undefined);
        updates.set(WEATHER_UV_INDEX as any, undefined);
      } else {
        const cw = data.current_weather ?? {};
        const hourly = data.hourly ?? {};
        const times: string[] = hourly.time ?? [];
        const idx = cw.time && Array.isArray(times) && times.length ? nearestHourIndex(times, cw.time) : 0;
        const temp = cw.temperature as number | undefined;
        const windspeed = (cw.windspeed as number | undefined);
        const winddirDeg = (cw.winddirection as number | undefined);
        const humidityArr: number[] = hourly.relativehumidity_2m ?? [];
        const rainArr: number[] = hourly.precipitation_probability ?? [];
        const cloudArr: number[] = hourly.cloudcover ?? [];
        const uvArr: number[] = hourly.uv_index ?? [];
        const humidity = humidityArr[idx] ?? undefined;
        const rain = rainArr[idx] ?? undefined;
        const cloud = cloudArr[idx] ?? undefined;
        const sunny = cloud != null ? Math.max(0, 100 - cloud) : undefined;
        const uv = uvArr[idx] ?? undefined;
        updates.set(WEATHER_TEMP_C as any, temp);
        updates.set(WEATHER_HUMIDITY as any, humidity);
        updates.set(WEATHER_WIND_SPEED as any, windspeed);
        updates.set(WEATHER_WIND_DIR as any, toCompass(winddirDeg));
        updates.set(WEATHER_RAIN_PCT as any, rain);
        updates.set(WEATHER_SUNNY_PCT as any, sunny);
        updates.set(WEATHER_UV_INDEX as any, uv);
      }
      console.log(`[OpenMeteoWeatherTap] mapResult: Publishing updates for ${_params.destContext.id}`, updates);
      return updates;
    }
  });
  // Add a 10-minute refresh interval by calling produce({ forceRefetch: true })
  const t = tap as any;
  const origOnAttach = t.onAttach?.bind(t);
  const origOnDetach = t.onDetach?.bind(t);
  let timer: any | null = null;
  t.onAttach = (home: any) => {
    origOnAttach?.(home);
    if (!timer) {
      timer = setInterval(() => {
        try { t.produce({ forceRefetch: true }); } catch {}
      }, 10 * 60 * 1000);
    }
  };
  t.onDetach = () => {
    if (timer) { clearInterval(timer); timer = null; }
    origOnDetach?.();
  };
  return tap;
}

class MeteoTapFactory implements TapFactory {
  readonly kind: 'TapFactory' = 'TapFactory';
  readonly provides = PROVIDES;

  build() {
    return createOpenMeteoWeatherTap();
  }
}
export const METEO_TAP_FACTORY = new MeteoTapFactory();

