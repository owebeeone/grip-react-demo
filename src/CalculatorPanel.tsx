import { useGrip } from '@owebeeone/grip-react';
import {
  CALC_DISPLAY, CALC_DIGIT_PRESSED, CALC_ADD_PRESSED, CALC_SUB_PRESSED,
  CALC_MUL_PRESSED, CALC_DIV_PRESSED, CALC_EQUALS_PRESSED, CALC_CLEAR_PRESSED,
} from './grips';

// Display and actions are contracts. CalculatorTap owns the calculation state
// and rules; this UI neither constructs that producer nor imports its class.
export default function CalculatorPanel() {
  const display = useGrip(CALC_DISPLAY);
  const digit = useGrip(CALC_DIGIT_PRESSED);
  const add = useGrip(CALC_ADD_PRESSED);
  const subtract = useGrip(CALC_SUB_PRESSED);
  const multiply = useGrip(CALC_MUL_PRESSED);
  const divide = useGrip(CALC_DIV_PRESSED);
  const equals = useGrip(CALC_EQUALS_PRESSED);
  const clear = useGrip(CALC_CLEAR_PRESSED);
  return <div>
    <div style={{ fontFamily: 'monospace', fontSize: 20, padding: 8, border: '1px solid #ccc', marginBottom: 8 }}>{display}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 48px)', gap: 8 }}>
      {[7, 8, 9].map(value => <button key={value} onClick={() => digit?.(value)}>{value}</button>)}
      <button onClick={() => divide?.()}>/</button>
      {[4, 5, 6].map(value => <button key={value} onClick={() => digit?.(value)}>{value}</button>)}
      <button onClick={() => multiply?.()}>*</button>
      {[1, 2, 3].map(value => <button key={value} onClick={() => digit?.(value)}>{value}</button>)}
      <button onClick={() => subtract?.()}>-</button>
      <button onClick={() => digit?.(0)}>0</button>
      <button onClick={() => clear?.()}>C</button>
      <button onClick={() => equals?.()}>=</button>
      <button onClick={() => add?.()}>+</button>
    </div>
  </div>;
}
