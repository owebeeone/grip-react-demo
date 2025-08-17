import { type Tap, createSimpleValueTap, BaseTap, Grip } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { CURRENT_TIME, COUNT, CURRENT_TAB, CALC_DISPLAY, WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, WEATHER_LOCATION } from './grips';

// Time tick: publish current time every second
class TimeTap extends BaseTap implements Tap {
  private timer: any | null = null;
  constructor() { super({ provides: [CURRENT_TIME] }); }
  private start() {
    if (this.timer) return;
    console.log('[TimeTap] start');
    const tick = () => {
      const updates = new Map([[CURRENT_TIME as any, new Date()]]);
      console.log('[TimeTap] tick publish to', this.producer?.getDestinations().size ?? 0, 'destinations');
      this.publish(updates);
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }
  private stop() {
    console.log('[TimeTap] stop');
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  onAttach(home: any): void {
    super.onAttach(home);
    // Do not start here; wait for first destination connect
    console.log('[TimeTap] onAttach at', home?.id);
  }
  onDetach(): void {
    console.log('[TimeTap] onDetach');
    this.stop();
    super.onDetach();
  }
  onConnect(dest: any, grip: any): void {
    super.onConnect(dest, grip);
    console.log('[TimeTap] onConnect dest', dest?.id, 'grip', (grip as any)?.key, 'destCount ->', this.producer?.getDestinations().size ?? 0);
    this.start();
  }
  onDisconnect(dest: any, grip: any): void {
    super.onDisconnect(dest, grip);
    console.log('[TimeTap] onDisconnect dest', dest?.id, 'grip', (grip as any)?.key, 'destCount ->', this.producer?.getDestinations().size ?? 0);
    const hasAny = (this.producer?.getDestinations().size ?? 0) > 0;
    if (!hasAny) this.stop();
  }
  produce(): void {}
  produceOnParams(): void {}
  produceOnDestParams(): void {}
}
export const TickTap: Tap = new TimeTap() as unknown as Tap;

// Counter & Tab taps via simple taps
export const CounterTap: Tap = createSimpleValueTap(COUNT, { initial: COUNT.defaultValue ?? 0 }) as unknown as Tap;
export const TabTap: Tap = createSimpleValueTap(CURRENT_TAB, { initial: CURRENT_TAB.defaultValue ?? 'clock' }) as unknown as Tap;

// Calculator: store display in a simple drip; UI helpers mutate the value directly
export const CalcDisplayTap: Tap = createSimpleValueTap(CALC_DISPLAY, { initial: CALC_DISPLAY.defaultValue ?? '0' }) as unknown as Tap;

// Weather tap driven by BaseTap. Reads WEATHER_LOCATION per-destination and publishes derived values.
class WeatherTapImpl extends BaseTap implements Tap {
  private timer: any | null = null;
  constructor() {
    super({ provides: [
      WEATHER_TEMP_C,
      WEATHER_HUMIDITY,
      WEATHER_WIND_SPEED,
      WEATHER_WIND_DIR,
      WEATHER_RAIN_PCT,
      WEATHER_SUNNY_PCT,
      WEATHER_UV_INDEX,
    ], destinationParamGrips: [WEATHER_LOCATION] });
  }
  onAttach(home: any): void {
    super.onAttach(home);
    const tick = () => {
      const dests = Array.from(this.producer?.getDestinations().keys() ?? []);
      for (const destNode of dests) {
        const dest = destNode.get_context();
        if (!dest) continue;
        const loc = dest.getOrCreateConsumer(WEATHER_LOCATION).get() ?? (WEATHER_LOCATION.defaultValue ?? 'Default');
        const now = Date.now();
        const lower = String(loc).toLowerCase();
        let offset = 0;
        for (let i = 0; i < lower.length; i++) offset = (offset + lower.charCodeAt(i)) % 10;
        const t = (Math.floor(now / 2000) + offset) % 10;
        const temp = 20 + offset + t;
        const humidity = 50 + ((t + offset) % 20);
        const wind = 10 + ((t + offset) % 5);
        const dir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][(t + offset) % 8];
        const rain = ((t * 7 + offset * 3) % 100);
        const sunny = 100 - rain;
        const uv = (t + offset) % 11;
        const updates = new Map<Grip<any>, any>([
          [WEATHER_TEMP_C as any, temp],
          [WEATHER_HUMIDITY as any, humidity],
          [WEATHER_WIND_SPEED as any, wind],
          [WEATHER_WIND_DIR as any, dir],
          [WEATHER_RAIN_PCT as any, rain],
          [WEATHER_SUNNY_PCT as any, sunny],
          [WEATHER_UV_INDEX as any, uv],
        ]);
        this.publish(updates, dest);
      }
    };
    tick();
    this.timer = setInterval(tick, 2000);
  }
  onDetach(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    super.onDetach();
  }
  produce(): void {}
  produceOnParams(): void { this.produce(); }
  produceOnDestParams(): void {}
}
export const WeatherTap: Tap = new WeatherTapImpl() as unknown as Tap;

// Registration helper
export function registerAllTaps() {
  grok.registerTap(TickTap);
  grok.registerTap(CounterTap);
  grok.registerTap(TabTap);
  grok.registerTap(CalcDisplayTap);
  grok.registerTap(WeatherTap);
}

// Convenience helpers for UI
export function incrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) + 1);
}

export function decrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) - 1);
}

export function setTab(tab: 'clock' | 'calc' | 'weather') {
  const d = grok.query(CURRENT_TAB, main);
  d.next(tab);
}

export const calc = {
  digit_pressed(d: number) {
    const drip = grok.query(CALC_DISPLAY, main);
    const display = String(drip.get() ?? '0');
    const next = display === '0' ? String(d) : display + String(d);
    drip.next(next);
  },
  add_pressed() {
    const d = grok.query(CALC_DISPLAY, main); const v = String(d.get() ?? '0'); d.next(v + '+');
  },
  sub_pressed() {
    const d = grok.query(CALC_DISPLAY, main); const v = String(d.get() ?? '0'); d.next(v + '-');
  },
  mul_pressed() {
    const d = grok.query(CALC_DISPLAY, main); const v = String(d.get() ?? '0'); d.next(v + '*');
  },
  div_pressed() {
    const d = grok.query(CALC_DISPLAY, main); const v = String(d.get() ?? '0'); d.next(v + '/');
  },
  equals_pressed() {
    const d = grok.query(CALC_DISPLAY, main); const expr = String(d.get() ?? '0');
    try { d.next(String(Function(`"use strict";return (${expr.replace(/[^\d+\-*/.]/g, '')})`)())); }
    catch { /* ignore */ }
  },
  clear_pressed() { grok.query(CALC_DISPLAY, main).next('0'); },
};


