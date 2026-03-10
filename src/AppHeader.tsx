import { useChildContext, useGrip } from '@owebeeone/grip-react';
import { WEATHER_TEMP_C } from './grips.weather';

export default function AppHeader() {
  const headerWeatherContext = useChildContext('header-weather');
  const tempSydney = useGrip(WEATHER_TEMP_C, headerWeatherContext) as number;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h3 style={{ margin: 0 }}>Grip React Demo</h3>
      <span>- Sydney temp {tempSydney}°C</span>
    </div>
  );
}


