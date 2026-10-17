import { useGrip, useSelectGrip } from '@owebeeone/grip-react';
import { LOCATION, LOCATION_TAP, TEMPERATURE } from './grips';

export default function WeatherColumn() {
  // GRIP supplies this column's values and mutator from its surrounding scope.
  const location = useSelectGrip(LOCATION, LOCATION_TAP);
  const temperature = useGrip(TEMPERATURE);

  return (
    <section>
      <label>
        Location
        <select {...location}>
          <option>Sydney</option>
          <option>Paris</option>
        </select>
      </label>
      <output>{temperature == null ? 'Loading' : `${temperature} °C`}</output>
    </section>
  );
}
