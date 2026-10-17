import { GripScope, createAtomValueTap } from '@owebeeone/grip-react';
import { LOCATION, LOCATION_TAP } from './grips';
import WeatherColumn from './WeatherColumn';

export default function WeatherColumns() {
  return (
    <div className="weather-columns">
      <section aria-label="Column 1">
        <GripScope scopeKey="weather-column:1" init={ctx =>
          ctx.getGripHomeContext().registerTap(createAtomValueTap(LOCATION, {
            initial: 'Sydney', handleGrip: LOCATION_TAP,
          }))
        }>
          <WeatherColumn />
        </GripScope>
      </section>
      <section aria-label="Column 2">
        <GripScope scopeKey="weather-column:2" init={ctx =>
          ctx.getGripHomeContext().registerTap(createAtomValueTap(LOCATION, {
            initial: 'Paris', handleGrip: LOCATION_TAP,
          }))
        }>
          <WeatherColumn />
        </GripScope>
      </section>
    </div>
  );
}
