import { useGrip, Drip, useRuntime } from '@owebeeone/grip-react';
import { useMemo } from 'react';
import { WEATHER_LOCATION, WEATHER_TEMP_C } from './grips';

export default function AppHeader() {
  const { context: parentCtx } = useRuntime();
  const locDrip = useMemo(() => new Drip<string>('Sydney'), []);
  const ctx = useMemo(() => parentCtx.createChild(undefined, [{ grip: WEATHER_LOCATION as any, drip: locDrip as any }]), [parentCtx, locDrip]);
  const tempSydney = useGrip(WEATHER_TEMP_C, ctx) as number;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h3 style={{ margin: 0 }}>Grip React Demo</h3>
      <span>- Sydney temp {tempSydney}°C</span>
    </div>
  );
}


