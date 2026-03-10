// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbGripSessionStore } from '@owebeeone/glial-local';
import {
  DEFAULT_DEMO_STATE,
  buildDemoSessionSnapshot,
  ensureDemoBrowserSession,
  extractDemoSessionState,
  saveDemoBrowserSessionState,
  type DemoPersistedState,
} from './demo_session';
import { COUNT } from './grips';
import { WEATHER_LOCATION } from './grips.weather';

describe('demo session persistence', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('round-trips a full persisted demo state through the local store', async () => {
    const store = new IndexedDbGripSessionStore({
      databaseName: `grip-react-demo-test-${crypto.randomUUID()}`,
      objectStoreName: 'sessions',
    });
    const sessionKey = 'demo-session-test-key';

    const initial = await ensureDemoBrowserSession({
      store,
      browserStorage: window.sessionStorage,
      sessionKey,
    });

    expect(initial.state).toEqual(DEFAULT_DEMO_STATE);

    const updatedState: DemoPersistedState = {
      count: 9,
      currentTab: 'weather',
      weatherProvider: 'mock',
      calcDisplay: '42/7',
      weatherLocations: {
        header: 'Perth',
        columnA: 'Paris',
        columnB: 'Melbourne',
      },
    };

    await saveDemoBrowserSessionState(initial.sessionId, updatedState, {
      store,
      browserStorage: window.sessionStorage,
      sessionKey,
    });

    const restored = await ensureDemoBrowserSession({
      store,
      browserStorage: window.sessionStorage,
      sessionKey,
    });

    expect(restored.sessionId).toBe(initial.sessionId);
    expect(restored.state).toEqual(updatedState);
  });

  it('extracts defaults when a snapshot is missing fields', () => {
    const snapshot = buildDemoSessionSnapshot(DEFAULT_DEMO_STATE);
    delete snapshot.contexts['main-presentation'].drips[COUNT.key];
    delete snapshot.contexts['demo-weather-column-b'].drips[WEATHER_LOCATION.key];

    const restored = extractDemoSessionState(snapshot);

    expect(restored.count).toBe(DEFAULT_DEMO_STATE.count);
    expect(restored.weatherLocations.columnB).toBe(DEFAULT_DEMO_STATE.weatherLocations.columnB);
  });
});
