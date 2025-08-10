// bootstrap.ts (or main.tsx before rendering App)
import { GripProvider } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { PAGE_SIZE } from './grips';
import { registerAllTaps } from './taps';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register taps upfront
registerAllTaps();

// Optional: seed an override at the root
main.setValue(PAGE_SIZE, 50);

// Demo exports
export { incrementCount, decrementCount, setTab, calc } from './taps';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={main}>
      <App />
    </GripProvider>
  </React.StrictMode>
);
