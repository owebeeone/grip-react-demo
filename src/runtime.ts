import { GripRegistry, GripOf, Grok } from '@owebeeone/grip-react';

export const registry = new GripRegistry();
export const defineGrip = GripOf(registry);

export const grok = new Grok(registry);
export const main = grok.mainContext;
export const headerWeatherContext = grok.createContext(grok.mainPresentationContext, 0, 'demo-header-weather');
export const weatherColumnAContext = grok.createContext(grok.mainPresentationContext, 0, 'demo-weather-column-a');
export const weatherColumnBContext = grok.createContext(grok.mainPresentationContext, 0, 'demo-weather-column-b');


