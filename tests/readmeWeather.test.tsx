import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { GripProvider, Grok, createAtomValueTap } from '@owebeeone/grip-react';
import App from '../src/readme/App';
import WeatherColumn from '../src/readme/WeatherColumn';
import { COORDINATES, LOCATION, LOCATION_TAP, TEMPERATURE, registry } from '../src/readme/grips';
import { createCoordinateWeatherTap, createGeocoderTap } from '../src/readme/providers';
import { createWeatherRuntime } from '../src/readme/runtime';

afterEach(cleanup);

it('tests the display with supplied data, without weather or geocoding producers', () => {
  const grok = new Grok(registry);
  grok.registerTap(createAtomValueTap(LOCATION, { initial: 'Sydney', handleGrip: LOCATION_TAP }));
  const temperature = createAtomValueTap(TEMPERATURE, { initial: 25 });
  grok.registerTap(temperature);
  const view = render(<GripProvider grok={grok}><WeatherColumn /></GripProvider>);
  // <output> has the implicit ARIA role "status".
  expect(view.getByRole('status').textContent).toBe('25 °C');
  act(() => { temperature.set(26); grok.flush(); });
  expect(view.getByRole('status').textContent).toBe('26 °C');
});

it('keeps both columns and their selected cities through provider changes', async () => {
  const grok = createWeatherRuntime();
  const view = render(<App grok={grok} />);
  const left = within(view.getByRole('region', { name: 'Column 1' }));
  const right = within(view.getByRole('region', { name: 'Column 2' }));
  await waitFor(() => expect(left.getByRole('status').textContent).toBe('20 °C'));
  expect(right.getByRole('status').textContent).toBe('12 °C');
  const column = left.getByRole('combobox');
  act(() => { fireEvent.change(column, { target: { value: 'Paris' } }); grok.flush(); });
  expect(left.getByRole('status').textContent).toBe('12 °C');
  act(() => { fireEvent.change(view.getByRole('combobox', { name: 'Weather provider' }), { target: { value: 'coordinates' } }); grok.flush(); });
  await waitFor(() => expect(left.getByRole('status').textContent).toBe('14 °C'));
  expect(right.getByRole('status').textContent).toBe('14 °C');
  expect(left.getByRole('combobox')).toBe(column);
  act(() => { fireEvent.change(column, { target: { value: 'Sydney' } }); grok.flush(); });
  await waitFor(() => expect(left.getByRole('status').textContent).toBe('22 °C'));
  expect(right.getByRole('status').textContent).toBe('14 °C');
  act(() => { fireEvent.change(view.getByRole('combobox', { name: 'Weather provider' }), { target: { value: 'mock' } }); grok.flush(); });
  await waitFor(() => expect(left.getByRole('status').textContent).toBe('20 °C'));
  expect(right.getByRole('status').textContent).toBe('12 °C');
});

it('tests the weather producer without React or a geocoder', async () => {
  const grok = new Grok(registry);
  const point = { latitude: -33.87, longitude: 151.21 };
  grok.registerTap(createAtomValueTap(COORDINATES, { initial: point }));
  const fetchTemperature = vi.fn(async () => 23);
  const weather = createCoordinateWeatherTap(fetchTemperature);
  grok.registerTap(weather);
  const result = grok.query(TEMPERATURE, grok.mainContext);
  const unsubscribe = result.subscribe(() => {});
  try {
    grok.flush();
    await waitFor(() => expect(result.get()).toBe(23));
    expect(fetchTemperature).toHaveBeenCalledWith(point, expect.any(AbortSignal));
  } finally {
    unsubscribe();
    grok.unregisterTap(weather);
  }
});

it('resolves the geocoder as a transitive input of the weather producer', async () => {
  const grok = new Grok(registry);
  grok.registerTap(createAtomValueTap(LOCATION, { initial: 'Paris' }));
  const lookup = vi.fn(() => ({ latitude: 48.86, longitude: 2.35 }));
  grok.registerTap(createGeocoderTap(lookup));
  const weather = createCoordinateWeatherTap();
  grok.registerTap(weather);
  expect(lookup).not.toHaveBeenCalled();
  const result = grok.query(TEMPERATURE, grok.mainContext);
  const unsubscribe = result.subscribe(() => {});
  try {
    grok.flush();
    await waitFor(() => expect(result.get()).toBe(14));
    expect(lookup).toHaveBeenCalledWith('Paris');
  } finally {
    unsubscribe();
    grok.unregisterTap(weather);
  }
});
