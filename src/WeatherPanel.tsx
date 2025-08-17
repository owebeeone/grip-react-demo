import WeatherColumn from './WeatherColumn';

export default function WeatherPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <WeatherColumn title="Location A" initialLocation="Sydney" />
      <WeatherColumn title="Location B" initialLocation="San Jose" />
    </div>
  );
}


