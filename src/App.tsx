// App.tsx (demo)
import { useGrip, useChildContext, GripGraphVisualizer, useRuntime, GraphDumpButton } from '@owebeeone/grip-react';
import { PAGE_SIZE, DESCRIPTION, COUNT, COUNT_TAP, CALC_DIGIT_PRESSED, CALC_ADD_PRESSED, CALC_SUB_PRESSED, CALC_MUL_PRESSED, CALC_DIV_PRESSED, CALC_EQUALS_PRESSED, CALC_CLEAR_PRESSED } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY } from './grips';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import WeatherPanel from './WeatherPanel';
import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  createAndSelectNewDemoLocalSession,
  getCurrentDemoBrowserSession,
  listDemoLocalSessions,
  selectDemoLocalSession,
} from './demo_session';

interface SessionOption {
  session_id: string;
  title?: string;
}

function ResizableGraphWrapper(props: { children: React.ReactNode }) {
  const { grok } = useRuntime();
  const [open, setOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const mainPanel = (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {props.children}
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0 }}>
        {!open ? (
          mainPanel
        ) : (
          <PanelGroup direction="horizontal" style={{ height: '100%', width: '100%' }}>
            <Panel defaultSize={50} minSize={30}>
              {mainPanel}
            </Panel>
            <PanelResizeHandle style={{ width: '6px', background: '#e0e0e0' }} />
            <Panel defaultSize={50} minSize={25}>
              <GripGraphVisualizer grok={grok} refreshMs={700} refreshTrigger={refreshTrigger} />
            </Panel>
          </PanelGroup>
        )}
      </div>
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: 8,
        zIndex: 2000
      }}>
        <button onClick={() => setOpen(o => !o)}>{open ? 'Hide Graph' : 'Show Graph'}</button>
        {open && <button onClick={() => setRefreshTrigger(c => c + 1)}>Refresh Graph</button>}
        <GraphDumpButton grok={grok} />
      </div>
    </div>
  );
}

function SessionControls() {
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [storageMode, setStorageMode] = useState<string>('local');
  const [localSessions, setLocalSessions] = useState<SessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [current, sessions] = await Promise.all([
        getCurrentDemoBrowserSession(),
        listDemoLocalSessions(),
      ]);
      if (cancelled) {
        return;
      }
      setCurrentSessionId(current.glialSessionId);
      setStorageMode(current.storageMode);
      setLocalSessions(sessions);
      setSelectedSessionId(current.glialSessionId);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadIntoSession = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
        Current logical session: <code>{currentSessionId || 'loading...'}</code>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
        Storage mode: <code>{storageMode}</code>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
          disabled={busy || localSessions.length === 0}
        >
          {localSessions.map((session) => (
            <option key={session.session_id} value={session.session_id}>
              {session.title ? `${session.title} (${session.session_id})` : session.session_id}
            </option>
          ))}
        </select>
        <button
          disabled={busy || !selectedSessionId || selectedSessionId === currentSessionId}
          onClick={() =>
            void reloadIntoSession(async () => {
              await selectDemoLocalSession(selectedSessionId);
            })
          }
        >
          Load Local Session
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void reloadIntoSession(async () => {
              await createAndSelectNewDemoLocalSession();
            })
          }
        >
          New Local Session
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext('app-row');
  const desc = useGrip(DESCRIPTION, rowCtx);
  const count = useGrip(COUNT); // produced by CounterTap
  const countTap = useGrip(COUNT_TAP);

  console.log('App', pageSize, count, desc);

  const calcDisplay = useGrip(CALC_DISPLAY);
  
  const tab = useGrip(CURRENT_TAB); // 'clock' | 'calc'

  const calcDigitPressed = useGrip(CALC_DIGIT_PRESSED);
  const calcAddPressed = useGrip(CALC_ADD_PRESSED);
  const calcSubPressed = useGrip(CALC_SUB_PRESSED);
  const calcMulPressed = useGrip(CALC_MUL_PRESSED);
  const calcDivPressed = useGrip(CALC_DIV_PRESSED);
  const calcEqualsPressed = useGrip(CALC_EQUALS_PRESSED);
  const calcClearPressed = useGrip(CALC_CLEAR_PRESSED);

  const inc = (c: number) => {
    if (c === undefined) {
      return 1;
    }
    return c + 1;
  };
  const dec = (c: number) => {
    if (c === undefined) {
      return 0;
    }
    return c - 1;
  };


  const mainContent = (
    <div style={{ padding: 16 }}>
      <SessionControls />
      <AppHeader />
      <TabBar />

      {tab === 'clock' && (
        <div>
          {!(count! & 1) ? <TimeClock /> : <div>Count is odd - no time</div>}
          <div>Page size: {pageSize}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Use setvalue API */}
            <button onClick={() => countTap?.update(dec)}>-</button>
            <div>Count: {count}</div>
            {/* Use atomic api to increment as an example. */}
            <button onClick={() => countTap?.update(inc)}>+</button>
          </div>
          <div>Description: {desc}</div>
        </div>
      )}

      {tab === 'calc' && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, padding: 8, border: '1px solid #ccc', marginBottom: 8 }}>
            {calcDisplay}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 48px)', gap: 8 }}>
            {[7,8,9].map(n => <button key={n} onClick={() => calcDigitPressed?.(n)}>{n}</button>)}
            <button onClick={() => calcDivPressed?.()}>/</button>
            {[4,5,6].map(n => <button key={n} onClick={() => calcDigitPressed?.(n)}>{n}</button>)}
            <button onClick={() => calcMulPressed?.()}>*</button>
            {[1,2,3].map(n => <button key={n} onClick={() => calcDigitPressed?.(n)}>{n}</button>)}
            <button onClick={() => calcSubPressed?.()}>-</button>
            <button onClick={() => calcDigitPressed?.(0)}>0</button>
            <button onClick={() => calcClearPressed?.()}>C</button>
            <button onClick={() => calcEqualsPressed?.()}>=</button>
            <button onClick={() => calcAddPressed?.()}>+</button>
          </div>
        </div>
      )}

      {tab === 'weather' && <WeatherPanel />}
    </div>
  );

  return <ResizableGraphWrapper>{mainContent}</ResizableGraphWrapper>;
}
