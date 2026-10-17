import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createAtomValueTap, GripProvider, Grok } from '@owebeeone/grip-react';
import ClockCounterPanel from '../src/ClockCounterPanel';
import { COUNT, COUNT_TAP, CURRENT_TIME } from '../src/grips';
import { registry } from '../src/runtime';

afterEach(cleanup);

function fixture() {
  const grok = new Grok(registry);
  const instant = new Date('2026-10-17T01:00:00Z');
  const tap = createAtomValueTap(COUNT, { initial: 1, handleGrip: COUNT_TAP });
  grok.registerTap(tap);
  grok.registerTap(createAtomValueTap(CURRENT_TIME, { initial: instant }));
  const view = render(<GripProvider grok={grok}><ClockCounterPanel /></GripProvider>);
  const input = view.getByRole('textbox', { name: 'Count', exact: true }) as HTMLInputElement;
  return { grok, tap, view, input, instant };
}

it('updates the independent counter and clock views through their shared GRIP value', () => {
  const { grok, view, input, instant } = fixture();
  expect(input.value).toBe('1');
  expect(view.getByText('Hidden')).toBeTruthy();
  expect(view.queryByLabelText('Current time')).toBeNull();
  act(() => { fireEvent.click(view.getByRole('button', { name: 'Increment count' })); grok.flush(); });
  expect(input.value).toBe('2');
  expect(view.getByLabelText('Current time').getAttribute('datetime')).toBe(instant.toISOString());
  act(() => { fireEvent.click(view.getByRole('button', { name: 'Decrement count' })); grok.flush(); });
  expect(input.value).toBe('1');
  expect(view.queryByLabelText('Current time')).toBeNull();
  expect(view.getByRole('textbox', { name: 'Description' })).toBeTruthy();
});

it('keeps the numeric draft and caret while publishing a normalized count', () => {
  const { grok, tap, view, input } = fixture();
  fireEvent.focus(input);
  act(() => {
    fireEvent.change(input, { target: { value: '002', selectionStart: 1, selectionEnd: 1 } });
    grok.flush();
  });
  expect(tap.get()).toBe(2);
  expect(view.getByLabelText('Current time')).toBeTruthy();
  expect(input.value).toBe('002');
  expect(input.selectionStart).toBe(1);
  act(() => { tap.set(8); grok.flush(); });
  expect(input.value).toBe('002');
  expect(input.selectionStart).toBe(1);
  act(() => { fireEvent.blur(input); grok.flush(); });
  expect(tap.get()).toBe(2);
  expect(input.value).toBe('2');
});

it('allows an unfinished negative or empty draft without publishing invalid numbers', () => {
  const { grok, tap, view, input } = fixture();
  fireEvent.focus(input);
  for (const value of ['', '-']) {
    act(() => { fireEvent.change(input, { target: { value } }); grok.flush(); });
    expect(input.value).toBe(value);
    expect(tap.get()).toBe(1);
    expect(view.queryByLabelText('Current time')).toBeNull();
  }
  act(() => { fireEvent.change(input, { target: { value: '-2' } }); grok.flush(); });
  expect(tap.get()).toBe(-2);
  expect(view.getByLabelText('Current time')).toBeTruthy();
  act(() => { fireEvent.change(input, { target: { value: '' } }); fireEvent.blur(input); grok.flush(); });
  expect(tap.get()).toBe(-2);
  expect(input.value).toBe('-2');
});
