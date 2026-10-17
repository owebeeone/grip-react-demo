import { GripScope, createAtomValueTap, useGrip } from '@owebeeone/grip-react';
import { WEATHER_PROVIDER_NAME, WEATHER_PROVIDER_NAME_TAP } from './grips';
import { WEATHER_LOCATION, WEATHER_LOCATION_TAP } from './grips.weather';
import WeatherColumn from './WeatherColumn';
import './App.css';

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
            aria-pressed={weatherProvider === 'meteo'}
            disabled={weatherProvider === 'meteo'}
          >
            Meteo
          </button>
          <button
            onClick={() => weatherProviderTap?.set('mock')}
            className={`weather-provider-button ${weatherProvider === 'mock' ? 'selected' : ''}`}
            aria-pressed={weatherProvider === 'mock'}
            disabled={weatherProvider === 'mock'}
          >
            Mock
          </button>
        </div>
      </div>
      <div className="example-columns">
        <GripScope scopeKey="weather-column:left" init={ctx =>
          ctx.getGripHomeContext().registerTap(createAtomValueTap(WEATHER_LOCATION, {
            initial: 'Sydney', handleGrip: WEATHER_LOCATION_TAP,
          }))
        }>
          <WeatherColumn title="Location A" />
        </GripScope>
        <GripScope scopeKey="weather-column:right" init={ctx =>
          ctx.getGripHomeContext().registerTap(createAtomValueTap(WEATHER_LOCATION, {
            initial: 'San Jose', handleGrip: WEATHER_LOCATION_TAP,
          }))
        }>
          <WeatherColumn title="Location B" />
        </GripScope>
      </div>
    </div>
  );
}


