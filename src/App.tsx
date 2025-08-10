// App.tsx (demo)
import { useGrip, useChildContext } from '@owebeeone/grip-react';
import { incrementCount, decrementCount } from './bootstrap';
import { PAGE_SIZE, DESCRIPTION, COUNT } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY, WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX } from './grips';
import { calc } from './bootstrap';
import TabBar from './TabBar';

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
  const temp = useGrip(WEATHER_TEMP_C) as number;
  const humidity = useGrip(WEATHER_HUMIDITY) as number;
  const wind = useGrip(WEATHER_WIND_SPEED) as number;
  const dir = useGrip(WEATHER_WIND_DIR) as string;
  const rain = useGrip(WEATHER_RAIN_PCT) as number;
  const sunny = useGrip(WEATHER_SUNNY_PCT) as number;
  const uv = useGrip(WEATHER_UV_INDEX) as number;

  return (
    <div style={{ padding: 16 }}>
      <h3>grip-react demo</h3>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', gap: 8 }}>
            <div>Temp (°C): {temp}</div>
            <div>Humidity (%): {humidity}</div>
            <div>Wind (kph): {wind}</div>
            <div>Wind Dir: {dir}</div>
            <div>Rain chance (%): {rain}</div>
            <div>Sunny (%): {sunny}</div>
            <div>UV Index: {uv}</div>
          </div>
        </div>
      )}
    </div>
  );
}
