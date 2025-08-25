import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import { WEATHER_SOURCE, WEATHER_SOURCE_TAP } from './grips.weather';

export default function WeatherSourceToggle() {
    const source = useGrip(WEATHER_SOURCE);
    const setSource = useGripSetter(WEATHER_SOURCE_TAP);

    const handleClick = () => {
        setSource(source === 'meteo' ? 'mock' : 'meteo');
    };

    return (
        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px' }}>
            <button onClick={handleClick}>
                Toggle Weather Source (Current: {source})
            </button>
        </div>
    );
}
