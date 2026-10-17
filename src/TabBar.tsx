import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TAB, CURRENT_TAB_TAP } from './grips';

export default function TabBar() {
  const tab = useGrip(CURRENT_TAB) as 'clock' | 'calc' | 'weather' | 'coins';
  const tabTap = useGrip(CURRENT_TAB_TAP);
  return (
    <nav className="demo-tabs" aria-label="Demo examples">
      <button onClick={() => tabTap?.set('clock')} disabled={tab === 'clock'} aria-current={tab === 'clock' ? 'page' : undefined}>
        Clock & Counter
      </button>
      <button onClick={() => tabTap?.set('calc')} disabled={tab === 'calc'} aria-current={tab === 'calc' ? 'page' : undefined}>
        Calculator
      </button>
      <button onClick={() => tabTap?.set('weather')} disabled={tab === 'weather'} aria-current={tab === 'weather' ? 'page' : undefined}>
        Weather
      </button>
      <button onClick={() => tabTap?.set('coins')} disabled={tab === 'coins'} aria-current={tab === 'coins' ? 'page' : undefined}>
        Coins
      </button>
    </nav>
  );
}


