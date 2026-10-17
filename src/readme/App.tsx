import { GripProvider, useSelectGrip, type Grok } from '@owebeeone/grip-react';
import { SOURCE, SOURCE_TAP } from './grips';
import WeatherColumns from './WeatherColumns';

function SourcePicker() {
  const source = useSelectGrip(SOURCE, SOURCE_TAP);
  return (
    <label>
      Weather provider
      <select {...source}>
        <option value="mock">Mock</option>
        <option value="coordinates">Coordinates (fixture)</option>
      </select>
    </label>
  );
}

export default function App({ grok }: { grok: Grok }) {
  return (
    <GripProvider grok={grok}>
      <h1>One weather column, two contexts</h1>
      <SourcePicker />
      <WeatherColumns />
    </GripProvider>
  );
}
