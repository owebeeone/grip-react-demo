import { useGrip } from '@owebeeone/grip-react';
import type { GripContext } from '@owebeeone/grip-react';
import { WEATHER_LOCATION, WEATHER_TEMP_C } from './grips';
import type { Drip } from '@owebeeone/grip-react';

const OPTIONS = ['Sydney', 'Melbourne', 'San Jose', 'Palo Alto', 'Paris'] as const;

export default function WeatherLocationSelect(props: { title: string; ctx: GripContext; locationDrip: Drip<string> }) {
  const current = useGrip(WEATHER_LOCATION, props.ctx) as string | undefined;
  const temp = useGrip(WEATHER_TEMP_C, props.ctx) as number; // drives updates

  const value = current ?? props.locationDrip.get() ?? OPTIONS[0];
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    props.locationDrip.next(loc);
  };

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


