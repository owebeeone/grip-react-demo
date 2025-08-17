import { useSelectGrip } from '@owebeeone/grip-react';
import type { GripContext } from '@owebeeone/grip-react';
import { WEATHER_LOCATION, WEATHER_LOCATION_TAP } from './grips';

const OPTIONS = ['Sydney', 'Melbourne', 'San Jose', 'Palo Alto', 'Paris'] as const;

  export default function WeatherLocationSelect(props: { title: string; ctx: GripContext }) {
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
    </div>
  );
}


