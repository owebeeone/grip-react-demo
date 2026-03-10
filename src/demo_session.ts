import {
  IndexedDbGripSessionStore,
  type ContextState,
  type GripSessionStore,
  type SessionSnapshot,
} from '@owebeeone/glial-local';
import {
  CALC_DISPLAY,
  COUNT,
  CURRENT_TAB,
  WEATHER_PROVIDER_NAME,
} from './grips';
import { WEATHER_LOCATION } from './grips.weather';
import {
  headerWeatherContext,
  weatherColumnAContext,
  weatherColumnBContext,
  grok,
} from './runtime';

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
  sessionId: string;
  state: DemoPersistedState;
}

export interface DemoSessionDependencies {
  store?: GripSessionStore;
  browserStorage?: Storage;
  sessionKey?: string;
}

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
let defaultStore: GripSessionStore | null = null;

function getDefaultStore(): GripSessionStore {
  if (!defaultStore) {
    defaultStore = new IndexedDbGripSessionStore({
      databaseName: 'grip-react-demo',
      objectStoreName: 'sessions',
    });
  }
  return defaultStore;
}

function getStore(deps?: DemoSessionDependencies): GripSessionStore {
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

function makeSessionId(): string {
  return `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function resolveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function buildContext(path: string, drips: ContextState['drips'], children: string[] = []): ContextState {
  return {
    path,
    name: path,
    children: [...children],
    drips,
  };
}

function buildDripState(name: string, value: unknown) {
  return {
    grip_id: name,
    name,
    value,
    taps: [],
  };
}

function readContextValue(snapshot: SessionSnapshot, path: string, gripId: string): unknown {
  return snapshot.contexts[path]?.drips[gripId]?.value;
}

export function buildDemoSessionSnapshot(state: DemoPersistedState): SessionSnapshot {
  const mainPath = grok.mainPresentationContext.id;
  return {
    session_id: undefined,
    contexts: {
      [mainPath]: buildContext(
        mainPath,
        {
          [COUNT.key]: buildDripState(COUNT.key, state.count),
          [CURRENT_TAB.key]: buildDripState(CURRENT_TAB.key, state.currentTab),
          [WEATHER_PROVIDER_NAME.key]: buildDripState(WEATHER_PROVIDER_NAME.key, state.weatherProvider),
          [CALC_DISPLAY.key]: buildDripState(CALC_DISPLAY.key, state.calcDisplay),
        },
        [headerWeatherContext.id, weatherColumnAContext.id, weatherColumnBContext.id],
      ),
      [headerWeatherContext.id]: buildContext(headerWeatherContext.id, {
        [WEATHER_LOCATION.key]: buildDripState(WEATHER_LOCATION.key, state.weatherLocations.header),
      }),
      [weatherColumnAContext.id]: buildContext(weatherColumnAContext.id, {
        [WEATHER_LOCATION.key]: buildDripState(WEATHER_LOCATION.key, state.weatherLocations.columnA),
      }),
      [weatherColumnBContext.id]: buildContext(weatherColumnBContext.id, {
        [WEATHER_LOCATION.key]: buildDripState(WEATHER_LOCATION.key, state.weatherLocations.columnB),
      }),
    },
  };
}

export function extractDemoSessionState(snapshot?: SessionSnapshot | null): DemoPersistedState {
  if (!snapshot) {
    return { ...DEFAULT_DEMO_STATE, weatherLocations: { ...DEFAULT_DEMO_STATE.weatherLocations } };
  }
  const mainPath = grok.mainPresentationContext.id;
  return {
    count: resolveNumber(
      readContextValue(snapshot, mainPath, COUNT.key),
      DEFAULT_DEMO_STATE.count,
    ),
    currentTab: resolveString(
      readContextValue(snapshot, mainPath, CURRENT_TAB.key),
      DEFAULT_DEMO_STATE.currentTab,
    ) as DemoPersistedState['currentTab'],
    weatherProvider: resolveString(
      readContextValue(snapshot, mainPath, WEATHER_PROVIDER_NAME.key),
      DEFAULT_DEMO_STATE.weatherProvider,
    ) as DemoPersistedState['weatherProvider'],
    calcDisplay: resolveString(
      readContextValue(snapshot, mainPath, CALC_DISPLAY.key),
      DEFAULT_DEMO_STATE.calcDisplay,
    ),
    weatherLocations: {
      header: resolveString(
        readContextValue(snapshot, headerWeatherContext.id, WEATHER_LOCATION.key),
        DEFAULT_DEMO_STATE.weatherLocations.header,
      ),
      columnA: resolveString(
        readContextValue(snapshot, weatherColumnAContext.id, WEATHER_LOCATION.key),
        DEFAULT_DEMO_STATE.weatherLocations.columnA,
      ),
      columnB: resolveString(
        readContextValue(snapshot, weatherColumnBContext.id, WEATHER_LOCATION.key),
        DEFAULT_DEMO_STATE.weatherLocations.columnB,
      ),
    },
  };
}

async function ensureSessionRecord(
  sessionId: string,
  deps?: DemoSessionDependencies,
): Promise<void> {
  const store = getStore(deps);
  const existing = await store.getSession(sessionId);
  if (!existing) {
    await store.newSession({
      session_id: sessionId,
      title: 'Grip React Demo',
      initial_snapshot: buildDemoSessionSnapshot(DEFAULT_DEMO_STATE),
    });
  }
}

export async function ensureDemoBrowserSession(
  deps?: DemoSessionDependencies,
): Promise<DemoBrowserSession> {
  const storage = getBrowserStorage(deps);
  const sessionKey = getSessionKey(deps);
  let sessionId = storage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = makeSessionId();
    storage.setItem(sessionKey, sessionId);
  }
  await ensureSessionRecord(sessionId, deps);
  const hydrated = await getStore(deps).hydrate(sessionId);
  return {
    sessionId,
    state: extractDemoSessionState(hydrated.snapshot),
  };
}

export async function saveDemoBrowserSessionState(
  sessionId: string,
  state: DemoPersistedState,
  deps?: DemoSessionDependencies,
): Promise<void> {
  await ensureSessionRecord(sessionId, deps);
  const snapshot = buildDemoSessionSnapshot(state);
  snapshot.session_id = sessionId;
  await getStore(deps).replaceSnapshot(sessionId, snapshot, 'collapse');
}
