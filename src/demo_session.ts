import {
  type BrowserSessionKind,
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
import { HttpGlialClient } from '@owebeeone/glial-net';
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
  sessionKind: BrowserSessionKind;
  title?: string;
  store: DemoSessionStore;
  glialBaseUrl: string;
  glialUserId: string;
}

export interface DemoSessionDependencies {
  store?: DemoSessionStore;
  browserStorage?: Storage;
  sessionKey?: string;
  glialBaseUrl?: string;
  glialUserId?: string;
  fetchImpl?: typeof fetch;
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

function getGlialBaseUrl(deps?: DemoSessionDependencies): string {
  if (deps?.glialBaseUrl) {
    return deps.glialBaseUrl.replace(/\/+$/, '');
  }
  const envBaseUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GLIAL_BASE_URL
      : undefined;
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8000';
}

function getGlialUserId(deps?: DemoSessionDependencies): string {
  if (deps?.glialUserId) {
    return deps.glialUserId;
  }
  const envUserId =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GLIAL_USER_ID
      : undefined;
  return envUserId ?? 'demo-user';
}

function createGlialClient(deps?: DemoSessionDependencies): HttpGlialClient {
  return new HttpGlialClient({
    baseUrl: getGlialBaseUrl(deps),
    fetchImpl: deps?.fetchImpl,
  });
}

function toDemoBrowserSession(
  record: BrowserSessionRecord,
  store: DemoSessionStore,
  deps?: DemoSessionDependencies,
): DemoBrowserSession {
  return {
    browserSessionId: record.browser_session_id,
    glialSessionId: record.glial_session_id,
    storageMode: record.storage_mode,
    sessionKind: record.session_kind,
    title: record.title,
    store,
    glialBaseUrl: getGlialBaseUrl(deps),
    glialUserId: getGlialUserId(deps),
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

async function ensureLocalShadowSession(
  store: DemoSessionStore,
  sessionId: string,
  title?: string,
): Promise<SessionSummary> {
  return (await store.getSession(sessionId)) ?? store.newSession({ session_id: sessionId, title });
}

export async function ensureDemoBrowserSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const record = await ensureBrowserSessionRecord(store, browserSessionId, {
    title: 'Grip React Demo',
    storageMode: 'local',
    sessionKind: 'local',
  });
  return toDemoBrowserSession(record, store, deps);
}

async function downgradeDemoBrowserSessionToLocal(
  browserSession: DemoBrowserSession,
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const localSession =
    (await store.getSession(browserSession.glialSessionId)) ??
    (await store.newSession({
      session_id: browserSession.glialSessionId,
      title: browserSession.title ?? 'Grip React Demo',
    }));
  const record = await bindBrowserSessionToExistingSession(
    store,
    browserSession.browserSessionId,
    localSession,
    'local',
    'local',
  );
  return toDemoBrowserSession(record, store, deps);
}

export async function prepareDemoBrowserSessionForBootstrap(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const browserSession = await ensureDemoBrowserSession(deps);
  if (browserSession.sessionKind === 'local') {
    return browserSession;
  }
  try {
    await createGlialClient(deps).loadRemoteSession(
      browserSession.glialUserId,
      browserSession.glialSessionId,
    );
    return browserSession;
  } catch {
    return downgradeDemoBrowserSessionToLocal(browserSession, deps);
  }
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
  const record = await bindBrowserSessionToExistingSession(
    store,
    browserSessionId,
    session,
    'local',
    'local',
  );
  return toDemoBrowserSession(record, store, deps);
}

export async function createAndSelectNewDemoLocalSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const session = await store.newSession({ title: 'Grip React Demo' });
  const record = await bindBrowserSessionToExistingSession(
    store,
    browserSessionId,
    session,
    'local',
    'local',
  );
  return toDemoBrowserSession(record, store, deps);
}

export async function listDemoRemoteSessions(
  deps?: DemoSessionDependencies,
): Promise<SessionSummary[]> {
  const client = createGlialClient(deps);
  const sessions = await client.listRemoteSessions(getGlialUserId(deps));
  return sessions.map((session) => ({
    session_id: session.session_id,
    title: session.title,
    mode: 'shared',
    last_modified_ms: session.last_modified_ms,
  }));
}

export async function probeDemoGlialAvailability(
  deps?: DemoSessionDependencies,
): Promise<boolean> {
  try {
    await listDemoRemoteSessions(deps);
    return true;
  } catch {
    return false;
  }
}

export async function selectDemoRemoteSession(
  glialSessionId: string,
  sessionKind: Exclude<BrowserSessionKind, 'local'>,
  storageMode: BrowserSessionStorageMode,
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const client = createGlialClient(deps);
  const remote = await client.loadRemoteSession(getGlialUserId(deps), glialSessionId);
  await ensureLocalShadowSession(store, glialSessionId, remote.title);
  const record: BrowserSessionRecord = {
    browser_session_id: browserSessionId,
    glial_session_id: remote.session_id,
    title: remote.title,
    storage_mode: storageMode,
    session_kind: sessionKind,
    last_opened_ms: Date.now(),
  };
  await store.putBrowserSession(record);
  return toDemoBrowserSession(record, store, deps);
}

export async function createAndSelectNewDemoRemoteSession(
  sessionKind: Exclude<BrowserSessionKind, 'local'>,
  storageMode: BrowserSessionStorageMode,
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const store = getStore(deps);
  const browserSessionId = getOrCreateBrowserSessionId(deps);
  const client = createGlialClient(deps);
  const session = await store.newSession({ title: 'Grip React Demo (Glial)' });
  const hydrated = await store.hydrate(session.session_id);
  const remote = await client.saveRemoteSession(
    getGlialUserId(deps),
    session.session_id,
    hydrated.snapshot as unknown as Record<string, unknown>,
    session.title ?? 'Grip React Demo (Glial)',
  );
  const record: BrowserSessionRecord = {
    browser_session_id: browserSessionId,
    glial_session_id: remote.session_id,
    title: remote.title,
    storage_mode: storageMode,
    session_kind: sessionKind,
    last_opened_ms: Date.now(),
  };
  await store.putBrowserSession(record);
  return toDemoBrowserSession(record, store, deps);
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
    sessionKind: 'local',
  });
  const nextRecord: BrowserSessionRecord = {
    ...existing,
    storage_mode: storageMode,
    last_opened_ms: Date.now(),
  };
  await store.putBrowserSession(nextRecord);
  return toDemoBrowserSession(nextRecord, store, deps);
}
