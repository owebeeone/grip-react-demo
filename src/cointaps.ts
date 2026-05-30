import {
  createAsyncStreamMultiTap,
  type DestinationParams,
  type Grip,
  type Tap,
  type TapFactory,
} from '@owebeeone/grip-react';
import {
  COIN_EXCHANGE,
  COIN_PRICE_USD,
  COIN_PRODUCT,
  COIN_STATUS,
  COIN_UPDATED_AT,
  COIN_VOLUME,
} from './grips.coin';

type CoinTick = {
  price: number;
  volume: number;
  exchange: string;
  status: string;
  updatedAt: Date;
};

type CoinOuts = {
  Price: typeof COIN_PRICE_USD;
  Volume: typeof COIN_VOLUME;
  Exchange: typeof COIN_EXCHANGE;
  Status: typeof COIN_STATUS;
  UpdatedAt: typeof COIN_UPDATED_AT;
};

export const COIN_TICK_OUTPUTS = [
  COIN_PRICE_USD,
  COIN_VOLUME,
  COIN_EXCHANGE,
  COIN_STATUS,
  COIN_UPDATED_AT,
] as const;

function productFromParams(params: DestinationParams): string | undefined {
  const product = params.get(COIN_PRODUCT);
  return product ? String(product).trim().toUpperCase() : undefined;
}

function productSeed(product: string): number {
  let seed = 0;
  for (let i = 0; i < product.length; i++) seed = (seed * 31 + product.charCodeAt(i)) >>> 0;
  return seed || 1;
}

function basePrice(product: string): number {
  if (product.startsWith('BTC')) return 65000;
  if (product.startsWith('ETH')) return 3200;
  if (product.startsWith('SOL')) return 150;
  if (product.startsWith('DOGE')) return 0.16;
  return 100;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function* mockCoinStream(product: string, signal: AbortSignal): AsyncIterable<CoinTick> {
  const seed = productSeed(product);
  const base = basePrice(product);
  let index = 0;
  while (!signal.aborted) {
    const wave = Math.sin((Date.now() / 900 + seed + index) / 7);
    const drift = Math.cos((Date.now() / 1400 + seed) / 11);
    const price = Math.max(0.0001, base * (1 + wave * 0.006 + drift * 0.003));
    const volume = 10 + ((seed + index * 17) % 90) + Math.abs(wave) * 25;
    yield {
      price,
      volume,
      exchange: 'MockCoin',
      status: 'streaming',
      updatedAt: new Date(),
    };
    index += 1;
    await wait(900, signal);
  }
}

export function createMockCoinTap(): Tap {
  return createAsyncStreamMultiTap<CoinOuts, CoinTick>({
    provides: COIN_TICK_OUTPUTS,
    destinationParamGrips: [COIN_PRODUCT],
    cleanupDelayMs: 250,
    requestKeyOf: (params) => productFromParams(params),
    subscribe: (params, signal) => {
      const product = productFromParams(params);
      if (!product) throw new Error('Missing coin product');
      return mockCoinStream(product, signal);
    },
    mapEvent: (_params, tick) =>
      new Map<Grip<any>, any>([
        [COIN_PRICE_USD as Grip<any>, tick.price],
        [COIN_VOLUME as Grip<any>, tick.volume],
        [COIN_EXCHANGE as Grip<any>, tick.exchange],
        [COIN_STATUS as Grip<any>, tick.status],
        [COIN_UPDATED_AT as Grip<any>, tick.updatedAt],
      ]),
    getResetUpdates: () =>
      new Map<Grip<any>, any>([
        [COIN_PRICE_USD as Grip<any>, undefined],
        [COIN_VOLUME as Grip<any>, undefined],
        [COIN_EXCHANGE as Grip<any>, ''],
        [COIN_STATUS as Grip<any>, 'idle'],
        [COIN_UPDATED_AT as Grip<any>, undefined],
      ]),
  });
}

class MockCoinTapFactory implements TapFactory {
  readonly kind = 'TapFactory' as const;
  readonly provides = COIN_TICK_OUTPUTS;

  build(): Tap {
    return createMockCoinTap();
  }
}

export const MOCK_COIN_TAP_FACTORY = new MockCoinTapFactory();
