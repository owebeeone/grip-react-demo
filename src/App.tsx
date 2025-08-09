import { createStore, useGrip } from '@owebeeone/grip-react';

// One shared store for the whole demo
type State = { count: number; text: string };
const store = createStore<State>({ count: 0, text: '' });

// A button group that only watches "count"
function Counter() {
  const count = useGrip(store, s => s.count);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => store.set(s => ({ ...s, count: s.count - 1 }))}>-</button>
      <span style={{ minWidth: 32, textAlign: 'center' }}>{count}</span>
      <button onClick={() => store.set(s => ({ ...s, count: s.count + 1 }))}>+</button>
    </div>
  );
}

// A text box that only watches "text"
function TextBox() {
  const text = useGrip(store, s => s.text);
  return (
    <input
      placeholder="Type something…"
      value={text}
      onChange={e => store.set(s => ({ ...s, text: e.target.value }))}
      style={{ padding: 6, width: 260 }}
    />
  );
}

// A derived selector (computed) — no extra state needed
function UppercasePreview() {
  const upper = useGrip(store, s => s.text.toUpperCase());
  return <code style={{ padding: 4, background: '#f5f5f5' }}>{upper || '...'}</code>;
}

export default function App() {
  // Full state if you ever need it:
  // const state = useGrip(store); // no selector → subscribes to whole state

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, display: 'grid', gap: 16 }}>
      <h1>grip-react demo</h1>
      <Counter />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <TextBox />
        <UppercasePreview />
      </div>
      <small>Try typing and clicking — only the components that depend on the changed slice re-render.</small>
    </div>
  );
}
