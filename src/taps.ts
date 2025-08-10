import { Drip, type Tap } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { CURRENT_TIME, COUNT, CURRENT_TAB, CALC_DISPLAY } from './grips';

// Time tick tap
export const TickTap: Tap = {
  id: 'tick',
  provides: [CURRENT_TIME],
  match: () => 1,
  produce: () => {
    const d = new Drip<Date>(new Date());
    let timer: any | undefined;
    d.onFirstSubscriber(() => {
      if (!timer) timer = setInterval(() => d.next(new Date()), 1000);
    });
    d.onZeroSubscribers(() => {
      if (timer) { clearInterval(timer); timer = undefined; }
    });
    return d as unknown as Drip<any>;
  },
};

// Counter tap
export const CounterTap: Tap = {
  id: 'counter',
  provides: [COUNT],
  match: () => 1,
  produce: (grip) => new Drip<number>((grip.defaultValue ?? 0) as number) as unknown as Drip<any>,
};

// Tab tap
export const TabTap: Tap = {
  id: 'tab',
  provides: [CURRENT_TAB],
  match: () => 1,
  produce: (grip) => new Drip<string>((grip.defaultValue ?? 'clock') as string) as unknown as Drip<any>,
};

// Calculator tap/state
class Calculator {
  private display = '0';
  private pendingOp: ('+' | '-' | '*' | '/') | null = null;
  private accumulator: number | null = null;
  private nextClear = true;
  private drip: Drip<string>;

  constructor(initial: string) {
    this.display = initial;
    this.drip = new Drip<string>(this.display);
  }

  private commitDisplay() { this.drip.next(this.display); }

  digit_pressed(digit: number) {
    if (digit < 0 || digit > 9) return;
    if (this.nextClear || this.display === '0') {
      this.display = String(digit);
      this.nextClear = false;
    } else {
      this.display = this.display + String(digit);
    }
    this.commitDisplay();
  }

  private applyPendingOp(nextValue: number) {
    if (this.pendingOp == null) { this.accumulator = nextValue; return; }
    const a = this.accumulator ?? 0;
    switch (this.pendingOp) {
      case '+': this.accumulator = a + nextValue; break;
      case '-': this.accumulator = a - nextValue; break;
      case '*': this.accumulator = a * nextValue; break;
      case '/': this.accumulator = nextValue === 0 ? NaN : a / nextValue; break;
    }
  }

  add_pressed() { this.op_pressed('+'); }
  sub_pressed() { this.op_pressed('-'); }
  mul_pressed() { this.op_pressed('*'); }
  div_pressed() { this.op_pressed('/'); }

  op_pressed(op: '+' | '-' | '*' | '/') {
    const value = Number(this.display);
    this.applyPendingOp(value);
    this.pendingOp = op;
    this.display = String(this.accumulator ?? value);
    this.nextClear = true;
    this.commitDisplay();
  }

  equals_pressed() {
    const value = Number(this.display);
    this.applyPendingOp(value);
    this.pendingOp = null;
    const out = this.accumulator ?? value;
    this.display = String(out);
    this.nextClear = true;
    this.commitDisplay();
  }

  clear_pressed() {
    this.display = '0';
    this.pendingOp = null;
    this.accumulator = null;
    this.nextClear = true;
    this.commitDisplay();
  }

  getDrip(): Drip<string> { return this.drip; }
}

export const CalculatorTap: Tap = {
  id: 'calculator',
  provides: [CALC_DISPLAY],
  match: () => 1,
  produce: (grip) => {
    const calc = new Calculator((grip.defaultValue ?? '0') as string);
    const drip = calc.getDrip() as unknown as Drip<any> & { __controller?: Calculator };
    drip.__controller = calc;
    return drip as unknown as Drip<any>;
  },
};

// Registration helper
export function registerAllTaps() {
  grok.registerTap(TickTap);
  grok.registerTap(CounterTap);
  grok.registerTap(TabTap);
  grok.registerTap(CalculatorTap);
}

// Convenience helpers for UI
export function incrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) + 1);
}

export function decrementCount() {
  const d = grok.query(COUNT, main);
  d.next((d.get() as number) - 1);
}

export function setTab(tab: 'clock' | 'calc') {
  const d = grok.query(CURRENT_TAB, main);
  d.next(tab);
}

function getCalculator(): any {
  const drip = grok.query(CALC_DISPLAY, main) as unknown as { __controller?: any };
  const controller = drip && (drip as any).__controller as any | undefined;
  if (!controller) throw new Error('Calculator controller missing');
  return controller;
}

export const calc = {
  digit_pressed(d: number) { getCalculator().digit_pressed(d); },
  add_pressed() { getCalculator().add_pressed(); },
  sub_pressed() { getCalculator().sub_pressed(); },
  mul_pressed() { getCalculator().mul_pressed(); },
  div_pressed() { getCalculator().div_pressed(); },
  equals_pressed() { getCalculator().equals_pressed(); },
  clear_pressed() { getCalculator().clear_pressed(); },
};


