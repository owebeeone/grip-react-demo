import type { AtomTapHandle } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';

export type CoinSource = 'mock' | 'coinbase' | 'binance';

export const COIN_SOURCE = defineGrip<CoinSource>('Coin.Source', 'mock');
export const COIN_SOURCE_TAP = defineGrip<AtomTapHandle<CoinSource>>('Coin.SourceTap');
export const COIN_PRODUCT = defineGrip<string>('Coin.Product', 'BTC-USD');
export const COIN_PRODUCT_TAP = defineGrip<AtomTapHandle<string>>('Coin.ProductTap');

export const COIN_PRICE_USD = defineGrip<number | undefined>('Coin.PriceUsd', undefined);
export const COIN_VOLUME = defineGrip<number | undefined>('Coin.Volume', undefined);
export const COIN_EXCHANGE = defineGrip<string>('Coin.Exchange', '');
export const COIN_STATUS = defineGrip<string>('Coin.Status', 'idle');
export const COIN_UPDATED_AT = defineGrip<Date | undefined>('Coin.UpdatedAt', undefined);
