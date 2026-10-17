import { createRoot } from 'react-dom/client';
import {
  GripOf, GripRegistry, Grok, GripProvider, useGrip,
  createAtomValueTap, type AtomTapHandle,
} from '@owebeeone/grip-react';

const registry = new GripRegistry();
const defineGrip = GripOf(registry);
const COUNT = defineGrip<number>('Count');
const COUNT_TAP = defineGrip<AtomTapHandle<number>>('Count.Handle');

const grok = new Grok(registry);
grok.registerTap(createAtomValueTap(COUNT, { initial: 0, handleGrip: COUNT_TAP }));

export function Counter() {
  const count = useGrip(COUNT);
  const counter = useGrip(COUNT_TAP);
  return <button onClick={() => counter?.update(n => n + 1)}>Count: {count}</button>;
}

createRoot(document.getElementById('root')!).render(
  <GripProvider grok={grok}><Counter /></GripProvider>,
);
