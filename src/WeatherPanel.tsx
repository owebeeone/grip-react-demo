import WeatherColumn from './WeatherColumn';

export default function WeatherPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <WeatherColumn title="Column A" initialLocation="Sydney" />
      <WeatherColumn title="Column B" initialLocation="San Jose" />
    </div>
  );
}


