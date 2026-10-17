import { GripOf, GripRegistry, type AtomTapHandle } from '@owebeeone/grip-react';

export const registry = new GripRegistry();
const defineGrip = GripOf(registry);

export type City = 'Sydney' | 'Paris';
export type Coordinates = { latitude: number; longitude: number };
export type WeatherSource = 'mock' | 'coordinates';

export const LOCATION = defineGrip<City>('Readme.Location');
export const LOCATION_TAP = defineGrip<AtomTapHandle<City>>('Readme.Location.Handle');
export const TEMPERATURE = defineGrip<number>('Readme.Temperature');
export const COORDINATES = defineGrip<Coordinates>('Readme.Coordinates');
export const SOURCE = defineGrip<WeatherSource>('Readme.Source', 'mock');
export const SOURCE_TAP = defineGrip<AtomTapHandle<WeatherSource>>('Readme.Source.Handle');
