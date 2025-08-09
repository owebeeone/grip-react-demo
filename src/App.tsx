// App.tsx (demo)
import { useGrip, useChildContext } from '@owebeeone/grip-react';
import { PAGE_SIZE, DESCRIPTION } from './bootstrap';
import TimeClock from './TimeClock';

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext();
  // A static tap could map rowCtx → DESCRIPTION, but here we just override directly:
  // rowCtx.setValue(DESCRIPTION, 'Row 12'); (in real code, a Tap would derive it)
  const desc = useGrip(DESCRIPTION, rowCtx);

  return (
    <div style={{ padding: 16 }}>
      <h3>grip-react demo</h3>
      <TimeClock />
      <div>Page size: {pageSize}</div>
      <div>Description: {desc}</div>
    </div>
  );
}
