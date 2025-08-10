import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TIME } from './grips';
import { memo } from 'react';

function TimeClockInner() {
  const now = useGrip(CURRENT_TIME) as Date;
  console.log('TimeClock', now.toLocaleTimeString());
  return <div>Time: {now.toLocaleTimeString()}</div>;
}

const TimeClock = memo(TimeClockInner);

export default TimeClock;


