import { type Tap, Grip, MultiAtomValueTap } from '@owebeeone/grip-react';
import { CALC_DISPLAY, CALC_ADD_PRESSED, CALC_CLEAR_PRESSED, CALC_DIGIT_PRESSED, CALC_DIV_PRESSED, CALC_EQUALS_PRESSED, CALC_MUL_PRESSED, CALC_SUB_PRESSED } from './grips';

// Calculator: Multi-atom tap that publishes CALC_DISPLAY and function grips
export class CalculatorTap extends MultiAtomValueTap implements Tap {
  static readonly outputs = [
    CALC_DISPLAY,
    CALC_DIGIT_PRESSED,
    CALC_ADD_PRESSED,
    CALC_SUB_PRESSED,
    CALC_MUL_PRESSED,
    CALC_DIV_PRESSED,
    CALC_EQUALS_PRESSED,
    CALC_CLEAR_PRESSED,
  ];
  constructor() {
    super(
      CalculatorTap.outputs,
      new Map<Grip<any>, any>([
        [CALC_DISPLAY as Grip<any>, (CALC_DISPLAY.defaultValue ?? '0')],
      ]),
      { handleGrip: undefined }
    );

    // Initialize function grips once
    const getDisplay = () => String(this.get(CALC_DISPLAY as Grip<string>) ?? '0');
    const setDisplay = (s: string) => this.set(CALC_DISPLAY as Grip<string>, s);

    this.setValue(CALC_DIGIT_PRESSED, (d: number) => {
      const display = getDisplay();
      const next = display === '0' ? String(d) : display + String(d);
      setDisplay(next);
    });
    this.setValue(CALC_ADD_PRESSED, () => {
      const v = getDisplay(); setDisplay(v + '+');
    });
    this.setValue(CALC_SUB_PRESSED, () => {
      const v = getDisplay(); setDisplay(v + '-');
    });
    this.setValue(CALC_MUL_PRESSED, () => {
      const v = getDisplay(); setDisplay(v + '*');
    });
    this.setValue(CALC_DIV_PRESSED, () => {
      const v = getDisplay(); setDisplay(v + '/');
    });
    this.setValue(CALC_EQUALS_PRESSED, () => {
      const expr = getDisplay();
      try {
        // sanitize to numbers/operators only
        const safe = expr.replace(/[^\d+\-*/.]/g, '');
        // eslint-disable-next-line no-new-func
        const result = String(Function(`"use strict";return (${safe})`)());
        setDisplay(result);
      } catch {}
    });
    this.setValue(CALC_CLEAR_PRESSED as Grip<() => void>, () => setDisplay('0'));
  }
}
