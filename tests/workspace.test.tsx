import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { createAtomValueTap, GripProvider, Grok } from '@owebeeone/grip-react';
import DemoWorkspace from '../src/DemoWorkspace';
import { registry } from '../src/runtime';
import { COUNT, COUNT_TAP } from '../src/grips';
import ClockCounterPanel from '../src/ClockCounterPanel';

afterEach(() => { cleanup(); vi.useRealTimers(); });
function fixture() {
  return render(<GripProvider grok={new Grok(registry)}><DemoWorkspace>
    <input aria-label="Retained edit" defaultValue="keep this" />
  </DemoWorkspace></GripProvider>);
}

it('opens a graph beside the running example without remounting it', () => {
  const view = fixture();
  const input = view.getByLabelText('Retained edit');
  fireEvent.change(input, { target: { value: 'edited' } });
  fireEvent.click(view.getByRole('button', { name: 'Show Graph' }));
  expect(view.getByRole('region', { name: 'Context graph' })).toBeTruthy();
  fireEvent.click(view.getByRole('button', { name: 'Hide Graph' }));
  expect(view.queryByRole('region', { name: 'Context graph' })).toBeNull();
  expect(view.getByLabelText('Retained edit')).toBe(input);
  expect((input as HTMLInputElement).value).toBe('edited');
});

it('shows edited demo values in the live graph while the demo stays mounted', () => {
  vi.useFakeTimers();
  const grok = new Grok(registry);
  grok.registerTap(createAtomValueTap(COUNT, { initial: 1, handleGrip: COUNT_TAP }));
  const view = render(<GripProvider grok={grok}><DemoWorkspace><ClockCounterPanel /></DemoWorkspace></GripProvider>);
  const input = view.getByRole('textbox', { name: 'Count', exact: true });
  fireEvent.click(view.getByRole('button', { name: 'Show Graph' }));
  const graph = view.getByRole('region', { name: 'Context graph' });
  expect(graph.closest('[data-panel-group]')).toBe(input.closest('[data-panel-group]'));
  expect(graph.closest('[data-panel-group]')).not.toBeNull();
  act(() => { fireEvent.change(input, { target: { value: '42' } }); grok.flush(); vi.advanceTimersByTime(750); });
  expect(within(graph).getByText('42')).toBeTruthy();
  expect(view.getByRole('textbox', { name: 'Count', exact: true })).toBe(input);
});

it('shows actual source for the selected example', () => {
  const view = fixture();
  fireEvent.click(view.getByRole('button', { name: 'View Code' }));
  const source = view.getByRole('region', { name: 'Example source' });
  expect(source.textContent).toContain('ClockCounterPanel');
  expect(source.textContent).toContain('initDescriptionEditor');
});
