import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { GripProvider, GripScope, Grok, createAtomValueTap, createFunctionTap, type Grip, type MatchingContext } from '@owebeeone/grip-react';
import WeatherColumn from '../src/WeatherColumn';
import WeatherPanel from '../src/WeatherPanel';
import CoinColumn from '../src/CoinColumn';
import CoinPanel from '../src/CoinPanel';
import { registry } from '../src/runtime';
import { WEATHER_LOCATION, WEATHER_LOCATION_TAP, WEATHER_TEMP_C, GEO_LABEL } from '../src/grips.weather';
import { WEATHER_PROVIDER_NAME, WEATHER_PROVIDER_NAME_TAP } from '../src/grips';
import { COIN_PRODUCT, COIN_PRODUCT_TAP, COIN_SOURCE, COIN_SOURCE_TAP, COIN_PRICE_USD } from '../src/grips.coin';

afterEach(cleanup);

function seedWeather(ctx: MatchingContext, city: string) {
  ctx.getGripHomeContext().registerTap(createAtomValueTap(WEATHER_LOCATION, { initial: city, handleGrip: WEATHER_LOCATION_TAP }));
}

function runtime() {
  const grok = new Grok(registry);
  grok.registerTap(createAtomValueTap(WEATHER_PROVIDER_NAME, { initial: 'mock', handleGrip: WEATHER_PROVIDER_NAME_TAP }));
  grok.registerTap(createFunctionTap({
    provides: [WEATHER_TEMP_C, GEO_LABEL],
    destinationParamGrips: [WEATHER_LOCATION],
    compute: ({ getDestParam }) => {
      const city = getDestParam(WEATHER_LOCATION);
      return new Map<Grip<unknown>, unknown>([[WEATHER_TEMP_C, city === 'Sydney' ? 20 : 10], [GEO_LABEL, city ?? '']]);
    },
  }));
  return grok;
}

describe('demo columns inside GripScope', () => {
  it('uses location and its mutator supplied by the enclosing scope without creating another context', () => {
    const grok = runtime();
    const tree = (city: string) => <GripProvider grok={grok}>
      <GripScope scopeKey="weather-column:1" init={ctx => seedWeather(ctx, city)}><WeatherColumn title="Weather" /></GripScope>
    </GripProvider>;
    const view = render(tree('Sydney'));
    const select = view.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Sydney');
    expect(view.getByText('20')).toBeTruthy();
    act(() => { fireEvent.change(select, { target: { value: 'Paris' } }); grok.flush(); });
    view.rerender(tree('Darwin'));
    expect((view.getByRole('combobox') as HTMLSelectElement).value).toBe('Paris');
    expect(view.getByText('10')).toBeTruthy();
  });

  it('keeps weather columns independent through location edits and provider-control rerenders', () => {
    const grok = runtime();
    const view = render(<GripProvider grok={grok}><WeatherPanel /></GripProvider>);
    const select = view.getAllByRole('combobox') as HTMLSelectElement[];
    expect(select.map(element => element.value)).toEqual(['Sydney', 'San Jose']);
    act(() => { fireEvent.change(select[0], { target: { value: 'Paris' } }); grok.flush(); });
    act(() => { fireEvent.click(view.getByRole('button', { name: 'Meteo' })); grok.flush(); });
    expect((view.getAllByRole('combobox') as HTMLSelectElement[]).map(element => element.value)).toEqual(['Paris', 'San Jose']);
  });

  it('uses coin product and source mutators supplied by each enclosing scope', () => {
    const grok = new Grok(registry);
    const seed = (ctx: MatchingContext, product: string) => {
      const home = ctx.getGripHomeContext();
      home.registerTap(createAtomValueTap(COIN_SOURCE, { initial: 'mock', handleGrip: COIN_SOURCE_TAP }));
      home.registerTap(createAtomValueTap(COIN_PRODUCT, { initial: product, handleGrip: COIN_PRODUCT_TAP }));
    };
    grok.registerTap(createFunctionTap({
      provides: [COIN_PRICE_USD], destinationParamGrips: [COIN_PRODUCT],
      compute: ({ getDestParam }) => new Map([[COIN_PRICE_USD, getDestParam(COIN_PRODUCT) === 'BTC-USD' ? 100 : 200]]),
    }));
    const view = render(<GripProvider grok={grok}>
      <section data-testid="left"><GripScope scopeKey="coin-column:1" init={ctx => seed(ctx, 'BTC-USD')}><CoinColumn title="Market" /></GripScope></section>
      <section data-testid="right"><GripScope scopeKey="coin-column:2" init={ctx => seed(ctx, 'ETH-USD')}><CoinColumn title="Market" /></GripScope></section>
    </GripProvider>);
    const left = within(view.getByTestId('left'));
    const right = within(view.getByTestId('right'));
    const leftProduct = left.getByRole('combobox', { name: 'Product' }) as HTMLSelectElement;
    expect(leftProduct.value).toBe('BTC-USD');
    expect((right.getByRole('combobox', { name: 'Product' }) as HTMLSelectElement).value).toBe('ETH-USD');
    act(() => { fireEvent.change(leftProduct, { target: { value: 'SOL-USD' } }); grok.flush(); });
    expect((left.getByRole('combobox', { name: 'Product' }) as HTMLSelectElement).value).toBe('SOL-USD');
    expect((right.getByRole('combobox', { name: 'Product' }) as HTMLSelectElement).value).toBe('ETH-USD');
    expect(left.getByText('$200.00')).toBeTruthy();
  });

  it('initializes both coin matchers and streams mock prices for their own products', async () => {
    vi.useFakeTimers();
    const grok = new Grok(registry);
    const view = render(<GripProvider grok={grok}><CoinPanel /></GripProvider>);
    const scopes = ['coin-column:left', 'coin-column:right'].map(key =>
      grok.mainContext.getGripConsumerContext().getOrCreateMatchingContext(key));
    try {
      await act(async () => { grok.flush(); await vi.advanceTimersByTimeAsync(10); grok.flush(); });
      expect(view.getAllByText('MockCoin', { selector: 'strong' })).toHaveLength(2);
      expect(view.getAllByText('streaming')).toHaveLength(2);
      const left = grok.query(COIN_PRICE_USD, scopes[0]);
      const right = grok.query(COIN_PRICE_USD, scopes[1]);
      expect(left.get()).toBeGreaterThan(60_000);
      expect(right.get()).toBeGreaterThan(3_000);
      expect(right.get()).toBeLessThan(4_000);
      const products = view.getAllByRole('combobox', { name: 'Product' });
      await act(async () => {
        fireEvent.change(products[0], { target: { value: 'SOL-USD' } });
        grok.flush(); await vi.advanceTimersByTimeAsync(10); grok.flush();
      });
      expect(left.get()).toBeGreaterThan(140);
      expect(left.get()).toBeLessThan(160);
      expect(right.get()).toBeGreaterThan(3_000);
      view.rerender(<GripProvider grok={grok}><CoinPanel /></GripProvider>);
      expect((view.getAllByRole('combobox', { name: 'Product' }) as HTMLSelectElement[])
        .map(select => select.value)).toEqual(['SOL-USD', 'ETH-USD']);
    } finally {
      view.unmount();
      for (const scope of scopes) {
        for (const id of ['mock-coin', 'coinbase', 'binance']) scope.removeBinding(id);
      }
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    }
  });
});
