import { type Tap, createAtomValueTap, BaseTap, Grip, type TapFactory } from '@owebeeone/grip-react';
import { grok } from './runtime';
import { CURRENT_TIME, COUNT, CURRENT_TAB, COUNT_TAP, CURRENT_TAB_TAP } from './grips';
import { WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, WEATHER_LOCATION } from './grips.weather';
import { createLocationToGeoTap, createOpenMeteoWeatherTap } from './openmeteo_taps';
import { CalculatorTap } from './taps_calculator';

// Calculator tap factory - just because we can. This would work fine as a tap instance
// but as a tap factory in theory we could add it in multiple places and it would
// be instantiated as needed.
export const CalcTap: TapFactory = {
  kind: 'TapFactory',
  provides: CalculatorTap.outputs,
  build: () => new CalculatorTap(),
}

// Time tick: publish current time every second
class TimeTap extends BaseTap implements Tap {
  private timer: any | null = null;
  constructor() { super({ provides: [CURRENT_TIME] }); }
  private start() {
    if (this.timer) return;
    const tick = () => {
      const updates = new Map([[CURRENT_TIME as any, new Date()]]);
      this.publish(updates);
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }
  private stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  onAttach(home: any): void {
    super.onAttach(home);
    // Do not start here; wait for first destination connect
  }
  onDetach(): void {
    this.stop();
    super.onDetach();
  }
  onConnect(dest: any, grip: any): void {
    super.onConnect(dest, grip);
    this.start();
  }
  onDisconnect(dest: any, grip: any): void {
    super.onDisconnect(dest, grip);
    const hasAny = (this.producer?.getDestinations().size ?? 0) > 0;
    if (!hasAny) this.stop();
  }
  produce(): void {}
  produceOnParams(): void {}
  produceOnDestParams(): void {}
}
export const TickTap: Tap = new TimeTap() as unknown as Tap;

// Counter & Tab taps via simple taps
export const CounterTap: Tap = createAtomValueTap(
  COUNT, 
  { initial: COUNT.defaultValue ?? 0, handleGrip: COUNT_TAP }) as unknown as Tap;
export const TabTap: Tap = createAtomValueTap(
    CURRENT_TAB, 
    { initial: CURRENT_TAB.defaultValue ?? 'clock', handleGrip: CURRENT_TAB_TAP });


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
      const now = Date.now();
      const destNodes = Array.from(this.producer?.getDestinations().keys() ?? []);
      const groups = new Map<string, any[]>();
      for (const destNode of destNodes) {
        const dest = destNode.get_context();
        if (!dest) continue;
        const loc = this.getDestParamValue(dest, WEATHER_LOCATION) ?? (WEATHER_LOCATION.defaultValue ?? 'Default');
        const key = String(loc);
        let arr = groups.get(key);
        if (!arr) { arr = []; groups.set(key, arr); }
        arr.push(dest);
      }

      const computeFor = (loc: string) => {
        const lower = loc.toLowerCase();
        console.log('[WeatherTap] tick', loc);
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
        return new Map<Grip<any>, any>([
          [WEATHER_TEMP_C as any, temp],
          [WEATHER_HUMIDITY as any, humidity],
          [WEATHER_WIND_SPEED as any, wind],
          [WEATHER_WIND_DIR as any, dir],
          [WEATHER_RAIN_PCT as any, rain],
          [WEATHER_SUNNY_PCT as any, sunny],
          [WEATHER_UV_INDEX as any, uv],
        ]);
      };

      for (const [loc, dests] of groups) {
        const updates = computeFor(loc);
        for (const dest of dests) this.publish(updates, dest);
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
  grok.registerTap(CalcTap);
  // Register live OpenMeteo taps at main so any context can resolve live data
  grok.registerTap(createLocationToGeoTap());
  grok.registerTap(createOpenMeteoWeatherTap());
  // Keep simulated tap as a fallback at the root (lower proximity than main)
  grok.registerTapAt(grok.rootContext, WeatherTap);
}




