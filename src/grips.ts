import type { SimpleValueTap } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';

export const CURRENT_TIME = defineGrip<Date>('CurrentTime', new Date());
export const PAGE_SIZE = defineGrip<number>('PageSize', 25);
export const DESCRIPTION = defineGrip<string>('Description', '');
export const COUNT = defineGrip<number>('Count', 0);
export const CALC_DISPLAY = defineGrip<string>('CalcDisplay', '0');
export const CURRENT_TAB = defineGrip<'clock' | 'calc' | 'weather'>('CurrentTab', 'clock');

// Weather grips
export const WEATHER_TEMP_C = defineGrip<number>('Weather.TempC', 20);
export const WEATHER_HUMIDITY = defineGrip<number>('Weather.HumidityPct', 50);
export const WEATHER_WIND_SPEED = defineGrip<number>('Weather.WindSpeedKph', 10);
export const WEATHER_WIND_DIR = defineGrip<string>('Weather.WindDir', 'N');
export const WEATHER_RAIN_PCT = defineGrip<number>('Weather.RainPct', 10);
export const WEATHER_SUNNY_PCT = defineGrip<number>('Weather.SunnyPct', 70);
export const WEATHER_UV_INDEX = defineGrip<number>('Weather.UV', 3);
export const WEATHER_LOCATION = defineGrip<string>('Weather.Location', 'Default');
export const WEATHER_LOCATION_TAP = defineGrip<SimpleValueTap<string>>('Weather.LocationTap', undefined);


