import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { GripProvider, GripScope, Grok } from '@owebeeone/grip-react';
import DescriptionEditor from '../src/DescriptionEditor';
import { initDescriptionEditor } from '../src/descriptionScope';
import { registry } from '../src/runtime';
import { DESCRIPTION, DESCRIPTION_TAP } from '../src/grips';

afterEach(cleanup);

function fixture() {
  const grok = new Grok(registry);
  const view = render(<GripProvider grok={grok}>
    <GripScope scopeKey="description-editor" init={initDescriptionEditor}>
      <DescriptionEditor />
    </GripScope>
  </GripProvider>);
  const context = grok.mainContext.getGripConsumerContext().getOrCreateMatchingContext('description-editor');
  const input = view.getByRole('textbox', { name: 'Description' }) as HTMLInputElement;
  return { grok, view, context, input };
}

describe('live description example', () => {
  it('updates derived values per keystroke without moving a caret in the middle', () => {
    const { grok, view, context, input } = fixture();
    fireEvent.focus(input);
    act(() => {
      fireEvent.change(input, { target: { value: 'Hello bright world', selectionStart: 12, selectionEnd: 12 } });
      grok.flush();
    });
    expect(grok.query(DESCRIPTION, context).get()).toBe('HELLO BRIGHT WORLD');
    expect(view.getByLabelText('Computed slug').textContent).toBe('hello-bright-world');
    expect(view.getByLabelText('Text statistics').textContent).toBe('3 words · 18 characters');
    expect(input.value).toBe('Hello bright world');
    expect(input.selectionStart).toBe(12);
    expect(input.selectionEnd).toBe(12);
  });

  it('protects a focused edit and selection from incoming values and commits it on blur', () => {
    const { grok, view, context, input } = fixture();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Hello bright world', selectionStart: 6, selectionEnd: 12 } });
    act(() => { grok.query(DESCRIPTION_TAP, context).get()!.set('SERVER UPDATE'); grok.flush(); });
    expect(view.getByLabelText('Computed slug').textContent).toBe('server-update');
    expect(input.value).toBe('Hello bright world');
    expect(input.selectionStart).toBe(6);
    expect(input.selectionEnd).toBe(12);
    act(() => { fireEvent.blur(input); grok.flush(); });
    expect(input.value).toBe('HELLO BRIGHT WORLD');
    expect(view.getByLabelText('Computed slug').textContent).toBe('hello-bright-world');
  });

  it('clears the computed result and counts when the input is emptied', () => {
    const { grok, view, input } = fixture();
    fireEvent.focus(input);
    act(() => { fireEvent.change(input, { target: { value: '' } }); grok.flush(); });
    expect(view.getByLabelText('Computed slug').textContent).toBe('—');
    expect(view.getByLabelText('Text statistics').textContent).toBe('0 words · 0 characters');
    expect(input.value).toBe('');
  });
});
