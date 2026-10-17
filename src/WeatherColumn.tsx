import { useGrip } from '@owebeeone/grip-react';
import { WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, GEO_LABEL } from './grips.weather';
import WeatherLocationSelect from './WeatherLocationSelect';

export default function WeatherColumn(props: { title: string }) {
	const temp = useGrip(WEATHER_TEMP_C);
	const humidity = useGrip(WEATHER_HUMIDITY);
	const wind = useGrip(WEATHER_WIND_SPEED);
	const dir = useGrip(WEATHER_WIND_DIR);
	const rain = useGrip(WEATHER_RAIN_PCT);
	const sunny = useGrip(WEATHER_SUNNY_PCT);
	const uv = useGrip(WEATHER_UV_INDEX);
	const weatherGeoLocation = useGrip(GEO_LABEL);

	return (
		<div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
			<WeatherLocationSelect title={props.title} />
			        
			<div style={{ marginBottom: 8, color: 'gray' }}>
				Location: <strong>{weatherGeoLocation}</strong>
			</div>
			<div style={{ display: 'grid', gridTemplateColumns: 'auto auto', rowGap: 6, columnGap: 8 }}>
				<div>Temp (°C)</div><div>{temp}</div>
				<div>Humidity (%)</div><div>{humidity}</div>
				<div>Wind (kph)</div><div>{wind}</div>
				<div>Wind Dir</div><div>{dir}</div>
				<div>Rain chance (%)</div><div>{rain}</div>
				<div>Sunny (%)</div><div>{sunny}</div>
				<div>UV Index</div><div>{uv}</div>
			</div>
		</div>
	);
}


