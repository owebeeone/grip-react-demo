import type { SimpleValueTap } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';

// Generic weather grips
export const WEATHER_TEMP_C = defineGrip<number>('Weather.TempC', 20);
export const WEATHER_HUMIDITY = defineGrip<number>('Weather.HumidityPct', 50);
export const WEATHER_WIND_SPEED = defineGrip<number>('Weather.WindSpeedKph', 10);
export const WEATHER_WIND_DIR = defineGrip<string>('Weather.WindDir', 'N');
export const WEATHER_RAIN_PCT = defineGrip<number>('Weather.RainPct', 10);
export const WEATHER_SUNNY_PCT = defineGrip<number>('Weather.SunnyPct', 70);
export const WEATHER_UV_INDEX = defineGrip<number>('Weather.UV', 3);

// Location input and its handle
export const WEATHER_LOCATION = defineGrip<string>('Weather.Location', 'Default');
export const WEATHER_LOCATION_TAP = defineGrip<SimpleValueTap<string>>('Weather.LocationTap', undefined);

// Geocoding outputs
export const GEO_LAT = defineGrip<number>('Geo.Lat', 0);
export const GEO_LNG = defineGrip<number>('Geo.Lng', 0);
export const GEO_LABEL = defineGrip<string>('Geo.Label', '');


