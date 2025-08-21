import type { AtomTapHandle } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';

export const CURRENT_TIME = defineGrip<Date>('CurrentTime', new Date());
export const PAGE_SIZE = defineGrip<number>('PageSize', 25);
export const DESCRIPTION = defineGrip<string>('Description', '');
export const COUNT = defineGrip<number>('Count', 0);
export const COUNT_TAP = defineGrip<AtomTapHandle<number>>('Count.Tap');
export const CALC_DISPLAY = defineGrip<string>('CalcDisplay', '0');
export const CURRENT_TAB = defineGrip<'clock' | 'calc' | 'weather'>('CurrentTab', 'clock');

// Weather-specific grips moved to `./grips.weather`

// Calculator function grips (outputs as functions; not settable)
export const CALC_DIGIT_PRESSED = defineGrip<(d: number) => void>('Calc.DigitPressed');
export const CALC_ADD_PRESSED = defineGrip<() => void>('Calc.AddPressed');
export const CALC_SUB_PRESSED = defineGrip<() => void>('Calc.SubPressed');
export const CALC_MUL_PRESSED = defineGrip<() => void>('Calc.MulPressed');
export const CALC_DIV_PRESSED = defineGrip<() => void>('Calc.DivPressed');
export const CALC_EQUALS_PRESSED = defineGrip<() => void>('Calc.EqualsPressed');
export const CALC_CLEAR_PRESSED = defineGrip<() => void>('Calc.ClearPressed');


