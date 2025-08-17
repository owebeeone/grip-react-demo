// App.tsx (demo)
import { useGrip, useChildContext, GripGraphVisualizer, useRuntime } from '@owebeeone/grip-react';
import { incrementCount, decrementCount } from './bootstrap';
import { PAGE_SIZE, DESCRIPTION, COUNT } from './grips';
import { CURRENT_TAB } from './grips';
import TimeClock from './TimeClock';
import { CALC_DISPLAY } from './grips';
import { calc } from './bootstrap';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import WeatherPanel from './WeatherPanel';
import React, { useCallback, useEffect, useRef, useState } from 'react';

function ResizableGraphWrapper(props: { children: React.ReactNode }) {
  const { grok } = useRuntime();
  const [open, setOpen] = useState(false);
  const [splitPosition, setSplitPosition] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);
  
  const handleToggleOpen = useCallback(() => {
    setOpen(o => {
        const willBeOpen = !o;
        if (willBeOpen && containerRef.current) {
            // If opening, and position is not set, calculate initial split
            if (splitPosition === null) {
                const containerWidth = containerRef.current.clientWidth;
                const minLeft = 240;
                const minRight = 300;
                const splitterWidth = 6;
                
                let initialPos = containerWidth / 2;
                
                // Ensure initial position respects min widths
                if (initialPos < minLeft) {
                    initialPos = minLeft;
                }
                if (containerWidth - initialPos - splitterWidth < minRight) {
                    initialPos = containerWidth - minRight - splitterWidth;
                }
                setSplitPosition(initialPos);
            }
        }
        return willBeOpen;
    });
  }, [splitPosition]);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Clamp between min sizes for both panes
      const minLeft = 240;
      const minRight = 300;
      const maxX = rect.width - minRight;
      const newX = Math.max(minLeft, Math.min(maxX, x));
      setSplitPosition(newX);
    }
    
    function handleUp() {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  // Use a sensible default for leftWidth if it hasn't been calculated yet
  const leftWidth = splitPosition ?? (containerRef.current?.clientWidth ?? 0) / 2;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div ref={containerRef} style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
        {!open ? (
          // Single pane mode - app takes full width
          <div style={{ flex: '1 1 auto', overflow: 'auto' }}>{props.children}</div>
        ) : (
          // Split pane mode
          <>
            <div style={{ 
              flex: 'none', // Left pane has fixed width
              width: `${leftWidth}px`,
              minWidth: 240,
              overflow: 'auto' 
            }}>
              {props.children}
            </div>
            <div 
              style={{ 
                width: 6, 
                cursor: 'col-resize', 
                background: '#e0e0e0',
                flexShrink: 0,
                position: 'relative'
              }} 
              onMouseDown={onMouseDown}
            >
              <div style={{
                position: 'absolute',
                inset: '-2px',
                zIndex: 1000
              }} />
            </div>
            <div style={{ 
              flex: '1 1 auto', // Right pane takes remaining space
              minWidth: 300,
              borderLeft: '1px solid #ddd', 
              background: '#fff', 
              display: 'flex'
            }}>
              <GripGraphVisualizer grok={grok} refreshMs={700} refreshTrigger={refreshTrigger} />
            </div>
          </>
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
        <button onClick={handleToggleOpen}>{open ? 'Hide Graph' : 'Show Graph'}</button>
        {open && <button onClick={() => setRefreshTrigger(c => c + 1)}>Refresh Graph</button>}
      </div>
    </div>
  );
}

export default function App() {
  const pageSize = useGrip(PAGE_SIZE);        // 50 (root override)

  // Child context: override DESCRIPTION locally (row-like)
  const rowCtx = useChildContext();
  const desc = useGrip(DESCRIPTION, rowCtx);
  const count = useGrip(COUNT) as number; // produced by CounterTap

  console.log('App', pageSize, count, desc);

  const calcDisplay = useGrip(CALC_DISPLAY);
  const tab = useGrip(CURRENT_TAB); // 'clock' | 'calc'

  const mainContent = (
    <div style={{ padding: 16 }}>
      <AppHeader />
      <TabBar />

      {tab === 'clock' && (
        <div>
          {!(count & 1) ? <TimeClock /> : <div>Count is odd - no time</div>}
          <div>Page size: {pageSize}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={decrementCount}>-</button>
            <div>Count: {count}</div>
            <button onClick={incrementCount}>+</button>
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
            {[7,8,9].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.div_pressed()}>/</button>
            {[4,5,6].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.mul_pressed()}>*</button>
            {[1,2,3].map(n => <button key={n} onClick={() => calc.digit_pressed(n)}>{n}</button>)}
            <button onClick={() => calc.sub_pressed()}>-</button>
            <button onClick={() => calc.digit_pressed(0)}>0</button>
            <button onClick={() => calc.clear_pressed()}>C</button>
            <button onClick={() => calc.equals_pressed()}>=</button>
            <button onClick={() => calc.add_pressed()}>+</button>
          </div>
        </div>
      )}

      {tab === 'weather' && <WeatherPanel />}
    </div>
  );

  return <ResizableGraphWrapper>{mainContent}</ResizableGraphWrapper>;
}
