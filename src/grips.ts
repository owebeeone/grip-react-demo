import type { AtomTapHandle } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';

export const CURRENT_TIME = defineGrip<Date>('CurrentTime', new Date());
export const PAGE_SIZE = defineGrip<number>('PageSize', 25);
export const DESCRIPTION = defineGrip<string>('Description', '');
export const COUNT = defineGrip<number>('Count', 0);
export const COUNT_TAP = defineGrip<AtomTapHandle<number>>('Count.Tap', 0);
export const CALC_DISPLAY = defineGrip<string>('CalcDisplay', '0');
export const CURRENT_TAB = defineGrip<'clock' | 'calc' | 'weather'>('CurrentTab', 'clock');

// Weather-specific grips moved to `./grips.weather`


