// bootstrap.ts (or main.tsx before rendering App)
import { GripProvider } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { registerAllTaps } from './taps';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register taps upfront
registerAllTaps();

// Toggle StrictMode with Vite env var: VITE_STRICT_MODE=true|false
// Persistent option (recommended): create grip-react-demo/.env.development with:
// VITE_STRICT_MODE=true
// or
// VITE_STRICT_MODE=false
const USE_STRICT_MODE = (import.meta as any).env?.VITE_STRICT_MODE === 'true';

const root = ReactDOM.createRoot(document.getElementById('root')!);
const app = (
  <GripProvider grok={grok} context={main}>
    <App />
  </GripProvider>
);

// root.render(USE_STRICT_MODE ? <React.StrictMode>{app}</React.StrictMode> : app);
root.render(app);
