// App.tsx (demo)
import { useGrip, useChildContext } from '@owebeeone/grip-react';
import { incrementCount, decrementCount } from './bootstrap';
import { PAGE_SIZE, DESCRIPTION, COUNT } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY } from './grips';
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
    </div>
  );
}
