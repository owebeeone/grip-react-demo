import { useGrip, useSelectGrip } from '@owebeeone/grip-react';
import type { GripContext } from '@owebeeone/grip-react';
import { WEATHER_LOCATION, WEATHER_LOCATION_TAP, WEATHER_TEMP_C } from './grips';

const OPTIONS = ['Sydney', 'Melbourne', 'San Jose', 'Palo Alto', 'Paris'] as const;

export default function WeatherLocationSelect(props: { title: string; ctx: GripContext }) {
  const temp = useGrip(WEATHER_TEMP_C, props.ctx) as number; // drives updates
  const bind = useSelectGrip(WEATHER_LOCATION, WEATHER_LOCATION_TAP, {
    ctx: props.ctx,
    format: (v) => v ?? OPTIONS[0],
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <label style={{ minWidth: 80 }}>{props.title}</label>
      <select {...bind}>
        {OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span>Temp: {temp}°C</span>
    </div>
  );
}


