import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_TIME } from './grips';
import { memo } from 'react';

function TimeClockInner() {
  const now = useGrip(CURRENT_TIME);
  return <time aria-label="Current time" dateTime={now?.toISOString()}>{now?.toLocaleTimeString() ?? '—'}</time>;
}

const TimeClock = memo(TimeClockInner);

export default TimeClock;


