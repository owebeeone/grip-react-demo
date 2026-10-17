import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TAB } from './grips';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import WeatherPanel from './WeatherPanel';
import CoinPanel from './CoinPanel';
import ClockCounterPanel from './ClockCounterPanel';
import CalculatorPanel from './CalculatorPanel';
import DemoWorkspace from './DemoWorkspace';

export default function App() {
  const tab = useGrip(CURRENT_TAB);
  return <DemoWorkspace>
    <div style={{ padding: 16 }}>
      <AppHeader />
      <TabBar />
      {tab === 'clock' && <ClockCounterPanel />}
      {tab === 'calc' && <CalculatorPanel />}
      {tab === 'weather' && <WeatherPanel />}
      {tab === 'coins' && <CoinPanel />}
    </div>
  </DemoWorkspace>;
}
