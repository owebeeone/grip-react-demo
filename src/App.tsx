// App.tsx (demo)
import { useGrip, useChildContext } from '@owebeeone/grip-react';
import { PAGE_SIZE, DESCRIPTION, COUNT, incrementCount, decrementCount } from './bootstrap';
import TimeClock from './TimeClock';

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext();
  // A static tap could map rowCtx → DESCRIPTION, but here we just override directly:
  // rowCtx.setValue(DESCRIPTION, 'Row 12'); (in real code, a Tap would derive it)
  const desc = useGrip(DESCRIPTION, rowCtx);
  const count = useGrip(COUNT); // produced by CounterTap

  console.log('App', pageSize, count, desc);

  return (
    <div style={{ padding: 16 }}>
      <h3>grip-react demo</h3>
      {!(count & 1) ? <TimeClock /> : <div>Count is odd - no time</div>}
      <div>Page size: {pageSize}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={decrementCount}>-</button>
        <div>Count: {count}</div>
        <button onClick={incrementCount}>+</button>
      </div>
      <div>Description: {desc}</div>
    </div>
  );
}
