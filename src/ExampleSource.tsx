import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import clock from './ClockCounterPanel.tsx?raw';
import timeClock from './TimeClock.tsx?raw';
import description from './DescriptionEditor.tsx?raw';
import descriptionScope from './descriptionScope.ts?raw';
import calculator from './CalculatorPanel.tsx?raw';
import calculatorTap from './taps_calculator.ts?raw';
import weather from './WeatherColumn.tsx?raw';
import weatherSelect from './WeatherLocationSelect.tsx?raw';
import weatherPanel from './WeatherPanel.tsx?raw';
import meteo from './openmeteo_taps.ts?raw';
import coin from './CoinColumn.tsx?raw';
import coinPanel from './CoinPanel.tsx?raw';
import coinScope from './coinScope.ts?raw';
import coinTaps from './cointaps.ts?raw';
import grips from './grips.ts?raw';
import weatherGrips from './grips.weather.ts?raw';
import coinGrips from './grips.coin.ts?raw';
import taps from './taps.ts?raw';

type SourceFile = { name: string; text: string };
const file = (name: string, text: string): SourceFile => ({ name, text });
const examples = {
  clock: {
    title: 'Clock & Counter', ui: [file('ClockCounterPanel.tsx', clock), file('DescriptionEditor.tsx', description), file('TimeClock.tsx', timeClock)],
    providers: [file('descriptionScope.ts', descriptionScope), file('grips.ts', grips), file('taps.ts', taps)],
  },
  calc: { title: 'Calculator', ui: [file('CalculatorPanel.tsx', calculator)], providers: [file('taps_calculator.ts', calculatorTap), file('grips.ts', grips)] },
  weather: { title: 'Weather', ui: [file('WeatherColumn.tsx', weather), file('WeatherLocationSelect.tsx', weatherSelect)], providers: [file('WeatherPanel.tsx', weatherPanel), file('openmeteo_taps.ts', meteo), file('grips.weather.ts', weatherGrips)] },
  coins: { title: 'Coins', ui: [file('CoinColumn.tsx', coin)], providers: [file('CoinPanel.tsx', coinPanel), file('coinScope.ts', coinScope), file('cointaps.ts', coinTaps), file('grips.coin.ts', coinGrips)] },
};

function SourceColumn({ title, files }: { title: string; files: SourceFile[] }) {
  const [index, setIndex] = useState(0);
  const source = files[index];
  return <section className="source-column">
    <label>{title}<select aria-label={`${title} source file`} value={index} onChange={event => setIndex(Number(event.target.value))}>
      {files.map((source, position) => <option key={source.name} value={position}>{source.name}</option>)}
    </select></label>
    <Highlight code={source.text} language={source.name.endsWith('.tsx') ? 'tsx' : 'typescript'} theme={themes.vsDark}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style} aria-label={`${source.name} source code`}><code>
          {tokens.map((line, lineIndex) => (
            <span key={lineIndex} {...getLineProps({ line })}>
              {line.map((token, tokenIndex) => <span key={tokenIndex} {...getTokenProps({ token })} />)}
              {lineIndex < tokens.length - 1 ? '\n' : null}
            </span>
          ))}
        </code></pre>
      )}
    </Highlight>
  </section>;
}

export default function ExampleSource({ tab }: { tab: keyof typeof examples }) {
  const example = examples[tab];
  return <div className="example-source">
    <h3>{example.title}</h3>
    <div className="source-columns">
      <SourceColumn key={`${tab}-ui`} title="UI" files={example.ui} />
      <SourceColumn key={`${tab}-providers`} title="Scope & providers" files={example.providers} />
    </div>
  </div>;
}
