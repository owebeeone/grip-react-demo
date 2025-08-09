import { memo } from 'react';
import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TIME } from './bootstrap';

function TimeClockInner() {
  const now = useGrip(CURRENT_TIME);
  return <div>Time: {now.toLocaleTimeString()}</div>;
}

const TimeClock = memo(TimeClockInner);
export default TimeClock;


