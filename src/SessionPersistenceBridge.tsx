import { useEffect, useMemo, useRef } from 'react';
import { useGrip } from '@owebeeone/grip-react';
import {
  CALC_DISPLAY,
  COUNT,
  CURRENT_TAB,
  WEATHER_PROVIDER_NAME,
} from './grips';
import { WEATHER_LOCATION } from './grips.weather';
import {
  DEFAULT_DEMO_STATE,
  saveDemoBrowserSessionState,
  type DemoPersistedState,
} from './demo_session';
import {
  headerWeatherContext,
  weatherColumnAContext,
  weatherColumnBContext,
} from './runtime';

const SAVE_DEBOUNCE_MS = 250;

export default function SessionPersistenceBridge(props: { sessionId: string }) {
  const count = useGrip(COUNT);
  const currentTab = useGrip(CURRENT_TAB);
  const weatherProvider = useGrip(WEATHER_PROVIDER_NAME);
  const calcDisplay = useGrip(CALC_DISPLAY);
  const headerLocation = useGrip(WEATHER_LOCATION, headerWeatherContext);
  const columnALocation = useGrip(WEATHER_LOCATION, weatherColumnAContext);
  const columnBLocation = useGrip(WEATHER_LOCATION, weatherColumnBContext);

  const persistedState = useMemo<DemoPersistedState>(
    () => ({
      count: count ?? DEFAULT_DEMO_STATE.count,
      currentTab: currentTab ?? DEFAULT_DEMO_STATE.currentTab,
      weatherProvider: weatherProvider ?? DEFAULT_DEMO_STATE.weatherProvider,
      calcDisplay: calcDisplay ?? DEFAULT_DEMO_STATE.calcDisplay,
      weatherLocations: {
        header: headerLocation ?? DEFAULT_DEMO_STATE.weatherLocations.header,
        columnA: columnALocation ?? DEFAULT_DEMO_STATE.weatherLocations.columnA,
        columnB: columnBLocation ?? DEFAULT_DEMO_STATE.weatherLocations.columnB,
      },
    }),
    [
      calcDisplay,
      columnALocation,
      columnBLocation,
      count,
      currentTab,
      headerLocation,
      weatherProvider,
    ],
  );

  const latestStateRef = useRef<DemoPersistedState>(persistedState);
  latestStateRef.current = persistedState;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveDemoBrowserSessionState(props.sessionId, latestStateRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [persistedState, props.sessionId]);

  useEffect(() => {
    const flush = () => {
      void saveDemoBrowserSessionState(props.sessionId, latestStateRef.current);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [props.sessionId]);

  return null;
}
