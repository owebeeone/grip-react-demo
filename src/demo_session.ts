import {
  bindBrowserSessionToExistingSession,
  createBrowserSessionId,
  ensureBrowserSessionRecord,
  IndexedDbGripSessionStore,
  type BrowserSessionRecord,
  type BrowserSessionRecordStore,
  type BrowserSessionStorageMode,
  type GripSessionStore,
  type SessionSummary,
} from '@owebeeone/glial-local';
import {
  CALC_DISPLAY,
  COUNT,
  CURRENT_TAB,
  WEATHER_PROVIDER_NAME,
} from './grips';

export interface DemoPersistedState {
  count: number;
  currentTab: 'clock' | 'calc' | 'weather';
  weatherProvider: 'meteo' | 'mock';
  calcDisplay: string;
  weatherLocations: {
    header: string;
    columnA: string;
    columnB: string;
  };
}

export interface DemoBrowserSession {
  browserSessionId: string;
  glialSessionId: string;
  storageMode: BrowserSessionStorageMode;
  title?: string;
  store: DemoSessionStore;
}

export interface DemoSessionDependencies {
  store?: DemoSessionStore;
  browserStorage?: Storage;
  sessionKey?: string;
}

export type DemoSessionStore = GripSessionStore & BrowserSessionRecordStore;

export const DEFAULT_DEMO_STATE: DemoPersistedState = {
  count: COUNT.defaultValue ?? 1,
  currentTab: CURRENT_TAB.defaultValue ?? 'clock',
  weatherProvider: WEATHER_PROVIDER_NAME.defaultValue ?? 'meteo',
  calcDisplay: CALC_DISPLAY.defaultValue ?? '0',
  weatherLocations: {
    header: 'Sydney',
    columnA: 'Sydney',
    columnB: 'San Jose',
  },
};

const DEFAULT_SESSION_KEY = 'grip-react-demo.browser-session-id';
let defaultStore: DemoSessionStore | null = null;

function getDefaultStore(): DemoSessionStore {
  if (!defaultStore) {
    defaultStore = new IndexedDbGripSessionStore({
      databaseName: 'grip-react-demo',
      objectStoreName: 'sessions',
      browserSessionStoreName: 'browser_sessions',
    });
  }
  return defaultStore;
}

function getStore(deps?: DemoSessionDependencies): DemoSessionStore {
  return deps?.store ?? getDefaultStore();
}

function getBrowserStorage(deps?: DemoSessionDependencies): Storage {
  if (deps?.browserStorage) {
    return deps.browserStorage;
  }
  if (typeof window === 'undefined' || !window.sessionStorage) {
    throw new Error('sessionStorage is not available in this environment');
  }
  return window.sessionStorage;
}

function getSessionKey(deps?: DemoSessionDependencies): string {
  return deps?.sessionKey ?? DEFAULT_SESSION_KEY;
}

function getOrCreateBrowserSessionId(deps?: DemoSessionDependencies): string {
  const storage = getBrowserStorage(deps);
  const sessionKey = getSessionKey(deps);
  let browserSessionId = storage.getItem(sessionKey);
  if (!browserSessionId) {
    browserSessionId = createBrowserSessionId('demo');
    storage.setItem(sessionKey, browserSessionId);
  }
  return browserSessionId;
}

function toDemoBrowserSession(record: BrowserSessionRecord, store: DemoSessionStore): DemoBrowserSession {
  return {
    browserSessionId: record.browser_session_id,
    glialSessionId: record.glial_session_id,
    storageMode: record.storage_mode,
    title: record.title,
    store,
  };
}

async function getSessionSummaryOrThrow(
  store: DemoSessionStore,
  sessionId: string,
): Promise<SessionSummary> {
  const summary = await store.getSession(sessionId);
  if (!summary) {
    throw new Error(`Unknown local session: ${sessionId}`);
  }
  return summary;
}

export async function ensureDemoBrowserSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const record = await ensureBrowserSessionRecord(store, browserSessionId, {
    title: 'Grip React Demo',
    storageMode: 'local',
  });
  return toDemoBrowserSession(record, store);
}

export async function getCurrentDemoBrowserSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  return ensureDemoBrowserSession(deps);
}

export async function listDemoLocalSessions(
  deps?: DemoSessionDependencies,
): Promise<SessionSummary[]> {
  return getStore(deps).listSessions();
}

export async function selectDemoLocalSession(
  glialSessionId: string,
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const session = await getSessionSummaryOrThrow(store, glialSessionId);
  const record = await bindBrowserSessionToExistingSession(store, browserSessionId, session, 'local');
  return toDemoBrowserSession(record, store);
}

export async function createAndSelectNewDemoLocalSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const session = await store.newSession({ title: 'Grip React Demo' });
  const record = await bindBrowserSessionToExistingSession(store, browserSessionId, session, 'local');
  return toDemoBrowserSession(record, store);
}

export async function updateDemoStorageMode(
  storageMode: BrowserSessionStorageMode,
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const existing = await ensureBrowserSessionRecord(store, browserSessionId, {
    title: 'Grip React Demo',
    storageMode,
  });
  const nextRecord: BrowserSessionRecord = {
    ...existing,
    storage_mode: storageMode,
    last_opened_ms: Date.now(),
  };
  await store.putBrowserSession(nextRecord);
  return toDemoBrowserSession(nextRecord, store);
}
