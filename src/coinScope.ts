import { createAtomValueTap, withOneOf, type MatchingContext } from '@owebeeone/grip-react';
import { BINANCE_TAP_FACTORY, COINBASE_TAP_FACTORY, MOCK_COIN_TAP_FACTORY } from './cointaps';
import { COIN_PRODUCT, COIN_PRODUCT_TAP, COIN_SOURCE, COIN_SOURCE_TAP } from './grips.coin';

/** Seed a column's data and provider choices when its scope is first created. */
export function initCoinColumn(ctx: MatchingContext, initialProduct: string): void {
  const home = ctx.getGripHomeContext();
  home.registerTap(createAtomValueTap(COIN_SOURCE, { initial: 'mock', handleGrip: COIN_SOURCE_TAP }));
  home.registerTap(createAtomValueTap(COIN_PRODUCT, { initial: initialProduct, handleGrip: COIN_PRODUCT_TAP }));

  ctx.addBinding({
    id: 'mock-coin',
    query: withOneOf(COIN_SOURCE, 'mock', 10).build(),
    tap: MOCK_COIN_TAP_FACTORY,
    baseScore: 5,
  });
  ctx.addBinding({
    id: 'coinbase',
    query: withOneOf(COIN_SOURCE, 'coinbase', 10).build(),
    tap: COINBASE_TAP_FACTORY,
    baseScore: 5,
  });
  ctx.addBinding({
    id: 'binance',
    query: withOneOf(COIN_SOURCE, 'binance', 10).build(),
    tap: BINANCE_TAP_FACTORY,
    baseScore: 5,
  });
}
