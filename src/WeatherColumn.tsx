import { useGrip } from '@owebeeone/grip-react';
import { WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, GEO_LABEL } from './grips.weather';
import WeatherLocationSelect from './WeatherLocationSelect';
import type { GripContext } from '@owebeeone/grip-react';

export default function WeatherColumn(props: { title: string; ctx: GripContext }) {
	const ctx = props.ctx;
	const temp = useGrip(WEATHER_TEMP_C, ctx);
	const humidity = useGrip(WEATHER_HUMIDITY, ctx);
	const wind = useGrip(WEATHER_WIND_SPEED, ctx);
	const dir = useGrip(WEATHER_WIND_DIR, ctx);
	const rain = useGrip(WEATHER_RAIN_PCT, ctx);
	const sunny = useGrip(WEATHER_SUNNY_PCT, ctx);
	const uv = useGrip(WEATHER_UV_INDEX, ctx);
	const weatherGeoLocation = useGrip(GEO_LABEL, ctx);

	return (
		<div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
			<WeatherLocationSelect title={props.title} ctx={ctx} />
			        
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


