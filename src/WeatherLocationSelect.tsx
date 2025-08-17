import { useGrip } from '@owebeeone/grip-react';
import type { GripContext, SimpleValueTap } from '@owebeeone/grip-react';
import { WEATHER_LOCATION, WEATHER_LOCATION_TAP, WEATHER_TEMP_C } from './grips';
import { useMemo } from 'react';

const OPTIONS = ['Sydney', 'Melbourne', 'San Jose', 'Palo Alto', 'Paris'] as const;

export default function WeatherLocationSelect(props: { title: string; ctx: GripContext }) {
  const current = useGrip(WEATHER_LOCATION, props.ctx) as string | undefined;
  const temp = useGrip(WEATHER_TEMP_C, props.ctx) as number; // drives updates
  const locationTap = useGrip(WEATHER_LOCATION_TAP, props.ctx) as SimpleValueTap<string>;

  const value = current ?? OPTIONS[0];

  const onChange = useMemo(() => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const loc = e.target.value;
      locationTap.set(loc);
    };
  }, [locationTap]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <label style={{ minWidth: 80 }}>{props.title}</label>
      <select value={value} onChange={onChange}>
        {OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span>Temp: {temp}°C</span>
    </div>
  );
}


