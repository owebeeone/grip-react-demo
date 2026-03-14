// bootstrap.ts (or main.tsx before rendering App)
import { GripProvider } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { registerAllTaps } from './taps';
import ReactDOM from 'react-dom/client';
import App from './App';
import { prepareDemoBrowserSessionForBootstrap } from './demo_session';
import { DemoGlialSessionSync } from './demo_glial_sync';

// Toggle StrictMode with Vite env var: VITE_STRICT_MODE=true|false
// Persistent option (recommended): create grip-react-demo/.env.development with:
// VITE_STRICT_MODE=true
// or
// VITE_STRICT_MODE=false
// const USE_STRICT_MODE = (import.meta as any).env?.VITE_STRICT_MODE === 'true';

async function bootstrap() {
  const browserSession = await prepareDemoBrowserSessionForBootstrap();
  registerAllTaps();
  await grok.attachLocalPersistence({
    sessionId: browserSession.glialSessionId,
    title: 'Grip React Demo',
    store: browserSession.store,
    flushDelayMs: 250,
  });

  let glialSync: DemoGlialSessionSync | null = null;
  if (browserSession.sessionKind !== 'local') {
    glialSync = new DemoGlialSessionSync({
      grok,
      store: browserSession.store,
      sessionId: browserSession.glialSessionId,
      title: browserSession.title,
      baseUrl: browserSession.glialBaseUrl,
      userId: browserSession.glialUserId,
      sessionKind: browserSession.sessionKind,
    });
    await glialSync.start();
  }

  const flushPersistence = () => {
    void grok.flushLocalPersistence();
    void glialSync?.flushNow();
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushPersistence();
    }
  };
  window.addEventListener('pagehide', flushPersistence);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', () => {
    glialSync?.stop();
  });

  const root = ReactDOM.createRoot(document.getElementById('root')!);
  const app = (
    <GripProvider grok={grok} context={main}>
      <App />
    </GripProvider>
  );

  // root.render(USE_STRICT_MODE ? <React.StrictMode>{app}</React.StrictMode> : app);
  root.render(app);
}

void bootstrap();
