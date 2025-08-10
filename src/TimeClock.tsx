import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TIME } from './bootstrap';
import { memo } from 'react';

function TimeClockInner() {
  const now = useGrip(CURRENT_TIME);
  console.log('TimeClock', now.toLocaleTimeString());
  return <div>Time: {now.toLocaleTimeString()}</div>;
}

const TimeClock = memo(TimeClockInner);

export default TimeClock;


