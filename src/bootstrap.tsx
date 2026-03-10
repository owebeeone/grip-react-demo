// bootstrap.ts (or main.tsx before rendering App)
import { GripProvider } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { registerAllTaps } from './taps';
import ReactDOM from 'react-dom/client';
import App from './App';
import SessionPersistenceBridge from './SessionPersistenceBridge';
import { ensureDemoBrowserSession } from './demo_session';

// Toggle StrictMode with Vite env var: VITE_STRICT_MODE=true|false
// Persistent option (recommended): create grip-react-demo/.env.development with:
// VITE_STRICT_MODE=true
// or
// VITE_STRICT_MODE=false
// const USE_STRICT_MODE = (import.meta as any).env?.VITE_STRICT_MODE === 'true';

async function bootstrap() {
  const browserSession = await ensureDemoBrowserSession();
  registerAllTaps(browserSession.state);

  const root = ReactDOM.createRoot(document.getElementById('root')!);
  const app = (
    <GripProvider grok={grok} context={main}>
      <SessionPersistenceBridge sessionId={browserSession.sessionId} />
      <App />
    </GripProvider>
  );

  // root.render(USE_STRICT_MODE ? <React.StrictMode>{app}</React.StrictMode> : app);
  root.render(app);
}

void bootstrap();
