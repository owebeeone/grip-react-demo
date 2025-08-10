import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TAB } from './grips';
import { setTab } from './bootstrap';

export default function TabBar() {
  const tab = useGrip(CURRENT_TAB) as 'clock' | 'calc';
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <button onClick={() => setTab('clock')} disabled={tab === 'clock'}>
        Clock & Counter
      </button>
      <button onClick={() => setTab('calc')} disabled={tab === 'calc'}>
        Calculator
      </button>
    </div>
  );
}


