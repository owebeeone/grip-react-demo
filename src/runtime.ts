import { GripRegistry, GripOf, Grok, GripContext } from '@owebeeone/grip-react';

export const registry = new GripRegistry();
export const defineGrip = GripOf(registry);

export const grok = new Grok();
export const main = new GripContext('main');


