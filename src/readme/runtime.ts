import { Grok, createAtomValueTap, withOneOf } from '@owebeeone/grip-react';
import { registry, SOURCE, SOURCE_TAP } from './grips';
import { createCoordinateWeatherTap, createGeocoderTap, createMockWeatherTap } from './providers';

export function createWeatherRuntime() {
  const grok = new Grok(registry);
  grok.registerTap(createAtomValueTap(SOURCE, { initial: 'mock', handleGrip: SOURCE_TAP }));
  grok.registerTap(createGeocoderTap());
  grok.addBinding({
    id: 'mock-weather',
    query: withOneOf(SOURCE, 'mock', 10).build(),
    tap: createMockWeatherTap(),
    baseScore: 5,
  });
  grok.addBinding({
    id: 'coordinate-weather',
    query: withOneOf(SOURCE, 'coordinates', 10).build(),
    tap: createCoordinateWeatherTap(),
    baseScore: 5,
  });
  return grok;
}
