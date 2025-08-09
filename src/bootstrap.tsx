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
    setInterval(() => d.next(new Date()), 1000);
    return d as unknown as Drip<any>;
  },
};
grok.registerTap(TickTap);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={main}>
      <App />
    </GripProvider>
  </React.StrictMode>
);
