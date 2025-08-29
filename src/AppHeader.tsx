import { useGrip, useRuntime, createAtomValueTap, type Tap } from '@owebeeone/grip-react';
import { useEffect, useMemo } from 'react';
import { WEATHER_LOCATION, WEATHER_TEMP_C } from './grips.weather';

export default function AppHeader() {
  const { context: parentCtx } = useRuntime();
  const ctx = useMemo(() => parentCtx.getGripConsumerContext().createChild(), [parentCtx]);
  // Provide WEATHER_LOCATION via a simple tap in the child context
  useEffect(() => {
    const tap = createAtomValueTap(WEATHER_LOCATION, { initial: 'Sydney' }) as unknown as Tap;
    ctx.registerTap(tap);
    return () => ctx.unregisterTap(tap);
  }, [ctx]);
  const tempSydney = useGrip(WEATHER_TEMP_C, ctx) as number;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h3 style={{ margin: 0 }}>Grip React Demo</h3>
      <span>- Sydney temp {tempSydney}°C</span>
    </div>
  );
}


