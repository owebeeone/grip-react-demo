import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GraphDumpButton, GripGraphVisualizer, useGrip, useRuntime } from '@owebeeone/grip-react';
import { CURRENT_TAB } from './grips';
import ExampleSource from './ExampleSource';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function DemoWorkspace({ children }: { children: ReactNode }) {
  const { grok } = useRuntime();
  const tab = useGrip(CURRENT_TAB) ?? 'clock';
  const [mode, setMode] = useState<'graph' | 'code' | null>(null);
  const [fit, setFit] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (mode) back.current?.focus(); }, [mode]);
  return (
    <div className={`demo-workspace${mode === 'graph' ? ' has-graph' : ''}`}>
      <PanelGroup direction="horizontal" className="workspace-panels">
        <Panel id="demo" order={1} minSize={25} defaultSize={45}>
          <div className="demo-running-example">{children}</div>
        </Panel>
        {mode === 'graph' && <>
          <PanelResizeHandle className="workspace-divider" />
          <Panel id="graph" order={2} minSize={25} defaultSize={55}>
            <section className="graph-pane" aria-label="Context graph">
              <header className="inspector-toolbar">
                <strong>Live graph</strong>
                <label><input type="checkbox" checked={fit} onChange={event => setFit(event.target.checked)} /> Fit graph</label>
                <button onClick={() => setRefresh(value => value + 1)}>Refresh</button>
              </header>
              <div className="inspector-content">
                <GripGraphVisualizer grok={grok} fitToPane={fit} refreshMs={700} refreshTrigger={refresh} showReapedContexts={false} />
              </div>
            </section>
          </Panel>
        </>}
      </PanelGroup>
      <footer className="demo-tools">
        <button onClick={() => setMode(mode === 'graph' ? null : 'graph')}>{mode === 'graph' ? 'Hide Graph' : 'Show Graph'}</button>
        <button onClick={() => setMode('code')}>View Code</button>
        <GraphDumpButton grok={grok} />
      </footer>
      {mode === 'code' && <section className="demo-inspector" aria-label="Example source"
        onKeyDown={event => { if (event.key === 'Escape') setMode(null); }}>
        <header className="inspector-toolbar">
          <strong>Example source</strong>
          <button ref={back} className="inspector-back" onClick={() => setMode(null)}>Back to demo</button>
        </header>
        <div className="inspector-content">
          <ExampleSource tab={tab} />
        </div>
      </section>}
    </div>
  );
}
