// App.tsx (demo)
import { useGrip, useChildContext, Drip, useRuntime } from '@owebeeone/grip-react';
import { useMemo } from 'react';
import { incrementCount, decrementCount } from './bootstrap';
import { PAGE_SIZE, DESCRIPTION, COUNT } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY, WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, WEATHER_LOCATION } from './grips';
import { calc } from './bootstrap';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import WeatherLocationSelect from './WeatherLocationSelect';

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext();
  // A static tap could map rowCtx → DESCRIPTION, but here we just override directly:
  // rowCtx.setValue(DESCRIPTION, 'Row 12'); (in real code, a Tap would derive it)
  const desc = useGrip(DESCRIPTION, rowCtx);
  const count = useGrip(COUNT) as number; // produced by CounterTap

  console.log('App', pageSize, count, desc);

  const calcDisplay = useGrip(CALC_DISPLAY);
  const tab = useGrip(CURRENT_TAB); // 'clock' | 'calc'
  // default location grips unused in the new layout (kept comment for reference)
  const { context: parentCtx } = useRuntime();
  const locDrip1 = useMemo(() => new Drip<string>('Sydney'), []);
  const locDrip2 = useMemo(() => new Drip<string>('San Jose'), []);
  const locCtx1 = useMemo(() => parentCtx.createChild(undefined, [{ grip: WEATHER_LOCATION as any, drip: locDrip1 as any }]), [parentCtx, locDrip1]);
  const locCtx2 = useMemo(() => parentCtx.createChild(undefined, [{ grip: WEATHER_LOCATION as any, drip: locDrip2 as any }]), [parentCtx, locDrip2]);
  const temp1 = useGrip(WEATHER_TEMP_C, locCtx1) as number;
  const humidity1 = useGrip(WEATHER_HUMIDITY, locCtx1) as number;
  const wind1 = useGrip(WEATHER_WIND_SPEED, locCtx1) as number;
  const dir1 = useGrip(WEATHER_WIND_DIR, locCtx1) as string;
  const rain1 = useGrip(WEATHER_RAIN_PCT, locCtx1) as number;
  const sunny1 = useGrip(WEATHER_SUNNY_PCT, locCtx1) as number;
  const uv1 = useGrip(WEATHER_UV_INDEX, locCtx1) as number;

  const temp2 = useGrip(WEATHER_TEMP_C, locCtx2) as number;
  const humidity2 = useGrip(WEATHER_HUMIDITY, locCtx2) as number;
  const wind2 = useGrip(WEATHER_WIND_SPEED, locCtx2) as number;
  const dir2 = useGrip(WEATHER_WIND_DIR, locCtx2) as string;
  const rain2 = useGrip(WEATHER_RAIN_PCT, locCtx2) as number;
  const sunny2 = useGrip(WEATHER_SUNNY_PCT, locCtx2) as number;
  const uv2 = useGrip(WEATHER_UV_INDEX, locCtx2) as number;

  return (
    <div style={{ padding: 16 }}>
      <AppHeader />
      <TabBar />

      {tab === 'clock' && (
        <div>
          {!(count & 1) ? <TimeClock /> : <div>Count is odd - no time</div>}
          <div>Page size: {pageSize}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={decrementCount}>-</button>
            <div>Count: {count}</div>
            <button onClick={incrementCount}>+</button>
          </div>
          <div>Description: {desc}</div>
        </div>
      )}

      {tab === 'calc' && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, padding: 8, border: '1px solid #ccc', marginBottom: 8 }}>
            {calcDisplay}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 48px)', gap: 8 }}>
            {[7,8,9].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.div_pressed()}>/</button>
            {[4,5,6].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.mul_pressed()}>*</button>
            {[1,2,3].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.sub_pressed()}>-</button>
            <button onClick={() => calc.digit_pressed(0)}>0</button>
            <button onClick={() => calc.clear_pressed()}>C</button>
            <button onClick={() => calc.equals_pressed()}>=</button>
            <button onClick={() => calc.add_pressed()}>+</button>
          </div>
        </div>
      )}

      {tab === 'weather' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <WeatherLocationSelect title="Column A" ctx={locCtx1} locationDrip={locDrip1} />
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', rowGap: 6, columnGap: 8 }}>
                <div>Temp (°C)</div><div>{temp1}</div>
                <div>Humidity (%)</div><div>{humidity1}</div>
                <div>Wind (kph)</div><div>{wind1}</div>
                <div>Wind Dir</div><div>{dir1}</div>
                <div>Rain chance (%)</div><div>{rain1}</div>
                <div>Sunny (%)</div><div>{sunny1}</div>
                <div>UV Index</div><div>{uv1}</div>
              </div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <WeatherLocationSelect title="Column B" ctx={locCtx2} locationDrip={locDrip2} />
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', rowGap: 6, columnGap: 8 }}>
                <div>Temp (°C)</div><div>{temp2}</div>
                <div>Humidity (%)</div><div>{humidity2}</div>
                <div>Wind (kph)</div><div>{wind2}</div>
                <div>Wind Dir</div><div>{dir2}</div>
                <div>Rain chance (%)</div><div>{rain2}</div>
                <div>Sunny (%)</div><div>{sunny2}</div>
                <div>UV Index</div><div>{uv2}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
