// App.tsx (demo)
import { useGrip, useChildContext, GripGraphVisualizer, useRuntime, GraphDumpButton } from '@owebeeone/grip-react';
import { PAGE_SIZE, DESCRIPTION, COUNT, COUNT_TAP, CALC_DIGIT_PRESSED, CALC_ADD_PRESSED, CALC_SUB_PRESSED, CALC_MUL_PRESSED, CALC_DIV_PRESSED, CALC_EQUALS_PRESSED, CALC_CLEAR_PRESSED } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY } from './grips';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import WeatherPanel from './WeatherPanel';
import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext();
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

  const mainContent = (
    <div style={{ padding: 16 }}>
      <AppHeader />
      <TabBar />

      {tab === 'clock' && (
        <div>
          {!(count! & 1) ? <TimeClock /> : <div>Count is odd - no time</div>}
          <div>Page size: {pageSize}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Use setvalue API */}
            <button onClick={() => countTap?.set(count! - 1)}>-</button>
            <div>Count: {count}</div>
            {/* Use atomic api to increment as an example. */}
            <button onClick={() => countTap?.set(c => c ? c + 1 : 1)}>+</button>
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
