import { Drip, type Tap } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { CURRENT_TIME, COUNT, CURRENT_TAB, CALC_DISPLAY, WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, WEATHER_LOCATION } from './grips';
import type { GripContext } from '@owebeeone/grip-react';

// Time tick tap
export const TickTap: Tap = {
  id: 'tick',
  provides: [CURRENT_TIME],
  match: () => 1,
  produce: () => {
    const d = new Drip<Date>(new Date());
    let timer: any | undefined;
    d.onFirstSubscriber(() => {
      if (!timer) timer = setInterval(() => d.next(new Date()), 1000);
    });
    d.onZeroSubscribers(() => {
      if (timer) { clearInterval(timer); timer = undefined; }
    });
    return d as unknown as Drip<any>;
  },
};

// Counter tap
export const CounterTap: Tap = {
  id: 'counter',
  provides: [COUNT],
  match: () => 1,
  produce: (grip) => new Drip<number>((grip.defaultValue ?? 0) as number) as unknown as Drip<any>,
};

// Tab tap
export const TabTap: Tap = {
  id: 'tab',
  provides: [CURRENT_TAB],
  match: () => 1,
  produce: (grip) => new Drip<string>((grip.defaultValue ?? 'clock') as string) as unknown as Drip<any>,
};

// Calculator tap/state
class Calculator {
  private display = '0';
  private pendingOp: ('+' | '-' | '*' | '/') | null = null;
  private accumulator: number | null = null;
  private nextClear = true;
  private drip: Drip<string>;

  constructor(initial: string) {
    this.display = initial;
    this.drip = new Drip<string>(this.display);
  }

  private commitDisplay() { this.drip.next(this.display); }

  digit_pressed(digit: number) {
    if (digit < 0 || digit > 9) return;
    if (this.nextClear || this.display === '0') {
      this.display = String(digit);
      this.nextClear = false;
    } else {
      this.display = this.display + String(digit);
    }
    this.commitDisplay();
  }

  private applyPendingOp(nextValue: number) {
    if (this.pendingOp == null) { this.accumulator = nextValue; return; }
    const a = this.accumulator ?? 0;
    switch (this.pendingOp) {
      case '+': this.accumulator = a + nextValue; break;
      case '-': this.accumulator = a - nextValue; break;
      case '*': this.accumulator = a * nextValue; break;
      case '/': this.accumulator = nextValue === 0 ? NaN : a / nextValue; break;
    }
  }

  add_pressed() { this.op_pressed('+'); }
  sub_pressed() { this.op_pressed('-'); }
  mul_pressed() { this.op_pressed('*'); }
  div_pressed() { this.op_pressed('/'); }

  op_pressed(op: '+' | '-' | '*' | '/') {
    const value = Number(this.display);
    this.applyPendingOp(value);
    this.pendingOp = op;
    this.display = String(this.accumulator ?? value);
    this.nextClear = true;
    this.commitDisplay();
  }

  equals_pressed() {
    const value = Number(this.display);
    this.applyPendingOp(value);
    this.pendingOp = null;
    const out = this.accumulator ?? value;
    this.display = String(out);
    this.nextClear = true;
    this.commitDisplay();
  }

  clear_pressed() {
    this.display = '0';
    this.pendingOp = null;
    this.accumulator = null;
    this.nextClear = true;
    this.commitDisplay();
  }

  getDrip(): Drip<string> { return this.drip; }
}

export const CalculatorTap: Tap = {
  id: 'calculator',
  provides: [CALC_DISPLAY],
  match: () => 1,
  produce: (grip) => {
    const calc = new Calculator((grip.defaultValue ?? '0') as string);
    const drip = calc.getDrip() as unknown as Drip<any> & { __controller?: Calculator };
    drip.__controller = calc;
    return drip as unknown as Drip<any>;
  },
};

// Registration helper
export function registerAllTaps() {
  grok.registerTap(TickTap);
  grok.registerTap(CounterTap);
  grok.registerTap(TabTap);
  grok.registerTap(CalculatorTap);
  grok.registerTap(WeatherTap);
}

// Weather Tap (multi-output mock)
export const WeatherTap: Tap = {
  id: 'weather',
  provides: [
    WEATHER_TEMP_C,
    WEATHER_HUMIDITY,
    WEATHER_WIND_SPEED,
    WEATHER_WIND_DIR,
    WEATHER_RAIN_PCT,
    WEATHER_SUNNY_PCT,
    WEATHER_UV_INDEX,
  ],
  match: () => 1,
  produce: (grip, ctx: GripContext, grok) => {
    // Read location from context lineage
    const ov = ctx.resolveOverride(WEATHER_LOCATION);
    const location = ov?.type === 'value' ? (ov.value as string) : (WEATHER_LOCATION.defaultValue ?? 'Default');
    const locationDrip = ov?.type === 'drip' ? (ov.drip as Drip<string>) : null;
    console.log('[WeatherTap] produce', { grip: (grip as any).key, ctx: ctx.id, initialLocation: location, hasLocationDrip: !!locationDrip });

    // Cache per (tap:weather, location)
    const key = `weather::${location}`;
    const store = (grok as any).__weatherCache ?? ((grok as any).__weatherCache = new Map<string, any>());
    let entry = store.get(key);
    if (!entry) {
      // Create drips for this location
      const temp = new Drip<number>((WEATHER_TEMP_C.defaultValue ?? 20) as number);
      const humidity = new Drip<number>((WEATHER_HUMIDITY.defaultValue ?? 50) as number);
      const wind = new Drip<number>((WEATHER_WIND_SPEED.defaultValue ?? 10) as number);
      const dir = new Drip<string>((WEATHER_WIND_DIR.defaultValue ?? 'N') as string);
      const rain = new Drip<number>((WEATHER_RAIN_PCT.defaultValue ?? 10) as number);
      const sunny = new Drip<number>((WEATHER_SUNNY_PCT.defaultValue ?? 70) as number);
      const uv = new Drip<number>((WEATHER_UV_INDEX.defaultValue ?? 3) as number);

      let tick = 0;
      const intId = setInterval(() => {
        tick += 1;
        // Stable offset by location for demo
        const lower = String(location).toLowerCase();
        let offset = 0;
        if (lower.includes('sydney')) offset = 3;
        else if (lower.includes('san jose')) offset = 7;
        else { for (let i = 0; i < lower.length; i++) offset = (offset + lower.charCodeAt(i)) % 10; }
        temp.next((20 + offset + (tick % 10)) as number);
        humidity.next((50 + ((tick + offset) % 20)) as number);
        wind.next((10 + ((tick + offset) % 5)) as number);
        dir.next(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][(tick + offset) % 8]);
        rain.next(((tick * 7 + offset * 3) % 100));
        sunny.next((100 - ((tick * 7 + offset * 3) % 100)));
        uv.next(((tick + offset) % 11));
      }, 2000);

      entry = { temp, humidity, wind, dir, rain, sunny, uv, intId };
      store.set(key, entry);
      console.log('[WeatherTap] create location producer', { location, key });
    }

    // If WEATHER_LOCATION is provided as a drip in this ctx, return a proxy that switches
    if (locationDrip) {
      // Helper to get the underlying drip for a given location/grip
      const getFor = (loc: string): Drip<any> => {
        const k = `weather::${loc}`;
        let e = store.get(k);
        if (!e) {
          // lazily create missing location on demand using same logic
          const temp = new Drip<number>((WEATHER_TEMP_C.defaultValue ?? 20) as number);
          const humidity = new Drip<number>((WEATHER_HUMIDITY.defaultValue ?? 50) as number);
          const wind = new Drip<number>((WEATHER_WIND_SPEED.defaultValue ?? 10) as number);
          const dir = new Drip<string>((WEATHER_WIND_DIR.defaultValue ?? 'N') as string);
          const rain = new Drip<number>((WEATHER_RAIN_PCT.defaultValue ?? 10) as number);
          const sunny = new Drip<number>((WEATHER_SUNNY_PCT.defaultValue ?? 70) as number);
          const uv = new Drip<number>((WEATHER_UV_INDEX.defaultValue ?? 3) as number);
          let tick = 0;
          const intId = setInterval(() => {
            tick += 1;
            let offset = 0;
            const lower = String(loc).toLowerCase();
            if (lower.includes('sydney')) offset = 3;
            else if (lower.includes('san jose')) offset = 7;
            else if (lower.includes('melbourne')) offset = 5;
            else if (lower.includes('palo alto')) offset = 6;
            else if (lower.includes('paris')) offset = 4;
            else { for (let i = 0; i < lower.length; i++) offset = (offset + lower.charCodeAt(i)) % 10; }
            temp.next((20 + offset + (tick % 10)) as number);
            humidity.next((50 + ((tick + offset) % 20)) as number);
            wind.next((10 + ((tick + offset) % 5)) as number);
            dir.next(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][(tick + offset) % 8]);
            rain.next(((tick * 7 + offset * 3) % 100));
            sunny.next((100 - ((tick * 7 + offset * 3) % 100)));
            uv.next(((tick + offset) % 11));
          }, 2000);
          e = { temp, humidity, wind, dir, rain, sunny, uv, intId };
          store.set(k, e);
        }
        switch (grip) {
          case WEATHER_TEMP_C: return e.temp as Drip<any>;
          case WEATHER_HUMIDITY: return e.humidity as Drip<any>;
          case WEATHER_WIND_SPEED: return e.wind as Drip<any>;
          case WEATHER_WIND_DIR: return e.dir as Drip<any>;
          case WEATHER_RAIN_PCT: return e.rain as Drip<any>;
          case WEATHER_SUNNY_PCT: return e.sunny as Drip<any>;
          case WEATHER_UV_INDEX: return e.uv as Drip<any>;
          default: return new Drip<any>(undefined as any);
        }
      };

      // Proxy drip that switches underlying subscription when location changes
      const initialLoc = locationDrip.get();
      const initialUnderlying = getFor(initialLoc);
      const proxy = new Drip<any>(initialUnderlying.get());
      let unsubUnder: (() => void) | null = null;
      let unsubLoc: (() => void) | null = null;
      const bind = (loc: string) => {
        if (unsubUnder) { unsubUnder(); unsubUnder = null; }
        const under = getFor(loc);
        proxy.next(under.get());
        unsubUnder = under.subscribe(v => proxy.next(v));
        console.log('[WeatherTap] bind', { ctx: ctx.id, grip: (grip as any).key, location: loc });
      };
      proxy.onFirstSubscriber(() => {
        bind(locationDrip.get());
        unsubLoc = locationDrip.subscribe(val => bind(val));
      });
      proxy.onZeroSubscribers(() => {
        if (unsubUnder) { unsubUnder(); unsubUnder = null; }
        if (unsubLoc) { unsubLoc(); unsubLoc = null; }
      });
      return proxy as Drip<any>;
    }

    // Fallback: static selection by current location
    switch (grip) {
      case WEATHER_TEMP_C: return entry.temp as Drip<any>;
      case WEATHER_HUMIDITY: return entry.humidity as Drip<any>;
      case WEATHER_WIND_SPEED: return entry.wind as Drip<any>;
      case WEATHER_WIND_DIR: return entry.dir as Drip<any>;
      case WEATHER_RAIN_PCT: return entry.rain as Drip<any>;
      case WEATHER_SUNNY_PCT: return entry.sunny as Drip<any>;
      case WEATHER_UV_INDEX: return entry.uv as Drip<any>;
      default: return new Drip<any>(undefined as any);
    }
  },
};


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

function getCalculator(): any {
  const drip = grok.query(CALC_DISPLAY, main) as unknown as { __controller?: any };
  const controller = drip && (drip as any).__controller as any | undefined;
  if (!controller) throw new Error('Calculator controller missing');
  return controller;
}

export const calc = {
  digit_pressed(d: number) { getCalculator().digit_pressed(d); },
  add_pressed() { getCalculator().add_pressed(); },
  sub_pressed() { getCalculator().sub_pressed(); },
  mul_pressed() { getCalculator().mul_pressed(); },
  div_pressed() { getCalculator().div_pressed(); },
  equals_pressed() { getCalculator().equals_pressed(); },
  clear_pressed() { getCalculator().clear_pressed(); },
};


