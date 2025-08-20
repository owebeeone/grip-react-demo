import { useGrip, useRuntime, useAtomValueTap } from '@owebeeone/grip-react';
import { WEATHER_LOCATION, WEATHER_TEMP_C, WEATHER_HUMIDITY, WEATHER_WIND_SPEED, WEATHER_WIND_DIR, WEATHER_RAIN_PCT, WEATHER_SUNNY_PCT, WEATHER_UV_INDEX, WEATHER_LOCATION_TAP } from './grips.weather';
import WeatherLocationSelect from './WeatherLocationSelect';
import { useMemo } from 'react';

export default function WeatherColumn(props: { title: string; initialLocation: string }) {
	const { context: parentCtx } = useRuntime();
	const ctx = useMemo(() => parentCtx.createChild(), [parentCtx]);

	useAtomValueTap(WEATHER_LOCATION, {
		ctx,
		initial: props.initialLocation,
		tapGrip: WEATHER_LOCATION_TAP,
	});

	const temp = useGrip(WEATHER_TEMP_C, ctx);
	const humidity = useGrip(WEATHER_HUMIDITY, ctx);
	const wind = useGrip(WEATHER_WIND_SPEED, ctx);
	const dir = useGrip(WEATHER_WIND_DIR, ctx);
	const rain = useGrip(WEATHER_RAIN_PCT, ctx);
	const sunny = useGrip(WEATHER_SUNNY_PCT, ctx);
	const uv = useGrip(WEATHER_UV_INDEX, ctx);

	return (
		<div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
			<WeatherLocationSelect title={props.title} ctx={ctx} />
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


