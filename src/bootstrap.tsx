// bootstrap.ts (or main.tsx before rendering App)
import { GripRegistry, GripOf } from '@owebeeone/grip-react';
import { Grok } from '@owebeeone/grip-react';
import { GripContext } from '@owebeeone/grip-react';
import { GripProvider } from '@owebeeone/grip-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const registry = new GripRegistry();
const defineGrip = GripOf(registry);

// Your global grips
export const CURRENT_TIME = defineGrip<Date>('CurrentTime', new Date());
export const PAGE_SIZE = defineGrip<number>('PageSize', 25);
export const DESCRIPTION = defineGrip<string>('Description', '');
export const COUNT = defineGrip<number>('Count', 0);

// Engine + main context (demo keeps its own explicit main to avoid relying on engine defaults)
const grok = new Grok();
const main = new GripContext('main');

// Optional: seed an override at the root
main.setValue(PAGE_SIZE, 50);

// Example: register a “tap” that produces CURRENT_TIME (ticks each second)
import { Drip, type Tap } from '@owebeeone/grip-react';
const TickTap: Tap = {
  id: 'tick',
  provides: [CURRENT_TIME],
  match: () => 1, // always available
  produce: (_grip, _ctx, _grok) => {
    const d = new Drip<Date>(new Date());
    let timer: any | undefined;
    d.onFirstSubscriber(() => {
      if (!timer) timer = setInterval(() => d.next(new Date()), 1000);
    });
    d.onZeroSubscribers(() => {
      if (timer) { clearInterval(timer); timer = undefined; }
    });
    return d as unknown as Drip<any>;
  },
};
grok.registerTap(TickTap);

// Counter tap provides COUNT as a produced drip
const CounterTap: Tap = {
  id: 'counter',
  provides: [COUNT],
  match: () => 1,
  produce: (grip) => {
    const d = new Drip<number>((grip.defaultValue ?? 0) as number);
    return d as unknown as Drip<any>;
  },
};
grok.registerTap(CounterTap);

// Demo helpers to mutate the COUNT drip in the main context
export function incrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) + 1);
}

export function decrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) - 1);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={main}>
      <App />
    </GripProvider>
  </React.StrictMode>
);
