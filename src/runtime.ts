import { GripRegistry, GripOf, Grok } from '@owebeeone/grip-react';

export const registry = new GripRegistry();
export const defineGrip = GripOf(registry);

export const grok = new Grok(registry);
export const main = grok.mainContext;


