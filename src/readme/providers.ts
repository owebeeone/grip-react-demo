import { createAsyncValueTap, createFunctionTap } from '@owebeeone/grip-react';
import { COORDINATES, LOCATION, TEMPERATURE, type City, type Coordinates } from './grips';

// Small, deterministic fixtures keep the introduction independent of a service.
const coordinates: Record<City, Coordinates> = {
  Sydney: { latitude: -33.87, longitude: 151.21 },
  Paris: { latitude: 48.86, longitude: 2.35 },
};

export function createMockWeatherTap() {
  // Type slots: outputs, home parameters (none), destination parameters.
  return createFunctionTap<
    { temperature: typeof TEMPERATURE }, Record<string, never>, { location: typeof LOCATION }
  >({
    provides: [TEMPERATURE],
    destinationParamGrips: [LOCATION],
    compute: ({ getDestParam }) => {
      const city = getDestParam(LOCATION);
      return new Map([[TEMPERATURE, city === 'Sydney' ? 20 : 12]]);
    },
  });
}

export function createGeocoderTap(lookup = (city: City) => coordinates[city]) {
  return createFunctionTap<
    { coordinates: typeof COORDINATES }, Record<string, never>, { location: typeof LOCATION }
  >({
    provides: [COORDINATES],
    destinationParamGrips: [LOCATION],
    compute: ({ getDestParam }) => {
      const city = getDestParam(LOCATION);
      return city ? new Map([[COORDINATES, lookup(city)]]) : new Map();
    },
  });
}

export function createCoordinateWeatherTap(
  fetchTemperature: (point: Coordinates, signal: AbortSignal) => Promise<number> =
    async point => point.latitude < 0 ? 22 : 14,
) {
  return createAsyncValueTap({
    provides: TEMPERATURE,
    destinationParamGrips: [COORDINATES],
    requestKeyOf: params => {
      const point = params.get(COORDINATES);
      return point ? `${point.latitude}:${point.longitude}` : undefined;
    },
    fetcher: (params, signal) => {
      const point = params.get(COORDINATES);
      if (!point) throw new Error('Weather requires coordinates');
      return fetchTemperature(point, signal);
    },
  });
}
