import { useGrip } from '@owebeeone/grip-react';
import { WEATHER_PROVIDER_NAME, WEATHER_PROVIDER_NAME_TAP } from './grips';
import WeatherColumn from './WeatherColumn';
import './App.css';
import { GEO_LABEL } from './grips.weather';

export default function WeatherPanel() {
  const weatherProvider = useGrip(WEATHER_PROVIDER_NAME);
  const weatherProviderTap = useGrip(WEATHER_PROVIDER_NAME_TAP);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>

        <span>
          Current weather provider: <strong>{weatherProvider}</strong>
        </span>
        <div>
          <button
            onClick={() => weatherProviderTap?.set('meteo')}
            className={`weather-provider-button ${weatherProvider === 'meteo' ? 'selected' : ''}`}
            disabled={weatherProvider === 'meteo'}
          >
            Meteo
          </button>
          <button
            onClick={() => weatherProviderTap?.set('mock')}
            className={`weather-provider-button ${weatherProvider === 'mock' ? 'selected' : ''}`}
            disabled={weatherProvider === 'mock'}
          >
            Mock
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <WeatherColumn title="Location A" initialLocation="Sydney" />
        <WeatherColumn title="Location B" initialLocation="San Jose" />
      </div>
    </div>
  );
}


