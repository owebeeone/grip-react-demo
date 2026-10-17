import { GripInput, GripScope, useGrip } from '@owebeeone/grip-react';
import { COUNT, COUNT_TAP } from './grips';
import TimeClock from './TimeClock';
import DescriptionEditor from './DescriptionEditor';
import { initDescriptionEditor } from './descriptionScope';

function parseCount(text: string): number | undefined {
  if (!/^-?\d+$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : undefined;
}

function CounterCard() {
  // Mutation is a context-provided capability, not local React counter state.
  const handle = useGrip(COUNT_TAP);
  return (
    <section className="demo-card counter-card" aria-label="Counter">
      <h3>Counter</h3>
      <div className="counter-controls">
        <button type="button" aria-label="Decrement count" onClick={() => handle?.update(value => value - 1)}>−</button>
        {/* Publish valid numbers while preserving the focused draft and caret,
            including unfinished input such as an empty field or just "-". */}
        <GripInput
          aria-label="Count"
          className="counter-value"
          grip={COUNT}
          tapGrip={COUNT_TAP}
          parse={parseCount}
          format={value => value == null ? '' : String(value)}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" aria-label="Increment count" onClick={() => handle?.update(value => value + 1)}>+</button>
      </div>
      <p className="card-caption">Shared through GRIP</p>
    </section>
  );
}

function ClockCard() {
  // Independently consume the same count. No counter props or callbacks are
  // needed: GRIP delivers changes, and React renders this visibility choice.
  const count = useGrip(COUNT);
  const visible = count != null && count % 2 === 0;
  return (
    <section className="demo-card clock-card" aria-label="Clock">
      <div className="card-heading">
        <h3>Clock</h3>
        <span className={`clock-status${visible ? ' is-live' : ''}`}>{visible ? 'Live' : 'Hidden'}</span>
      </div>
      <div className="clock-value">{visible ? <TimeClock /> : <span aria-hidden="true">—</span>}</div>
      <p className="card-caption">Visible when the count is even</p>
    </section>
  );
}

export default function ClockCounterPanel() {
  return (
    <div className="clock-counter-panel">
      <div className="clock-overview">
        <CounterCard />
        <ClockCard />
      </div>
      <GripScope scopeKey="description-editor" init={initDescriptionEditor}>
        <DescriptionEditor />
      </GripScope>
    </div>
  );
}
