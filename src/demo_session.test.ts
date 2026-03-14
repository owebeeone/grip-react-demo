// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndexedDbGripSessionStore } from '@owebeeone/glial-local';
import {
  createAndSelectNewDemoLocalSession,
  DEFAULT_DEMO_STATE,
  ensureDemoBrowserSession,
  listDemoLocalSessions,
  prepareDemoBrowserSessionForBootstrap,
  selectDemoLocalSession,
} from './demo_session';

function createStore() {
  return new IndexedDbGripSessionStore({
    databaseName: `grip-react-demo-test-${crypto.randomUUID()}`,
    objectStoreName: 'sessions',
    browserSessionStoreName: 'browser_sessions',
  });
}

describe('demo browser session', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('creates and reuses a stable browser session record', async () => {
    const store = createStore();
    const sessionKey = 'demo-session-test-key';

    const initial = await ensureDemoBrowserSession({
      store,
      browserStorage: window.sessionStorage,
      sessionKey,
    });
    const restored = await ensureDemoBrowserSession({
      store,
      browserStorage: window.sessionStorage,
      sessionKey,
    });

    expect(restored.browserSessionId).toBe(initial.browserSessionId);
    expect(restored.glialSessionId).toBe(initial.glialSessionId);
    expect(restored.store).toBe(store);
  });

  it('lists and switches local sessions through the browser-session record', async () => {
    const store = createStore();
    const deps = {
      store,
      browserStorage: window.sessionStorage,
      sessionKey: 'demo-session-switch-test',
    };

    const current = await ensureDemoBrowserSession(deps);
    const created = await createAndSelectNewDemoLocalSession(deps);
    const sessions = await listDemoLocalSessions(deps);

    expect(sessions.map((session) => session.session_id)).toContain(current.glialSessionId);
    expect(sessions.map((session) => session.session_id)).toContain(created.glialSessionId);

    const switched = await selectDemoLocalSession(current.glialSessionId, deps);
    expect(switched.glialSessionId).toBe(current.glialSessionId);
    expect(switched.browserSessionId).toBe(current.browserSessionId);
  });

  it('keeps the demo defaults available for tap registration', () => {
    expect(DEFAULT_DEMO_STATE.currentTab).toBe('clock');
    expect(DEFAULT_DEMO_STATE.weatherLocations.columnB).toBe('San Jose');
  });

  it('downgrades a persisted Glial session to local during bootstrap when Glial is unavailable', async () => {
    const store = createStore();
    const deps = {
      store,
      browserStorage: window.sessionStorage,
      sessionKey: 'demo-session-bootstrap-fallback',
      fetchImpl: vi.fn(async () => {
        throw new Error('offline');
      }) as typeof fetch,
    };

    const current = await ensureDemoBrowserSession(deps);
    await store.putBrowserSession({
      browser_session_id: current.browserSessionId,
      glial_session_id: current.glialSessionId,
      title: current.title,
      storage_mode: 'remote',
      session_kind: 'glial-shared',
      last_opened_ms: Date.now(),
    });

    const restored = await prepareDemoBrowserSessionForBootstrap(deps);
    const record = await store.getBrowserSession(current.browserSessionId);

    expect(restored.sessionKind).toBe('local');
    expect(restored.glialSessionId).toBe(current.glialSessionId);
    expect(record?.session_kind).toBe('local');
    expect(record?.storage_mode).toBe('local');
  });
});
