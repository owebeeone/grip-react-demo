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

const STREAM_RETRY = {
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  jitterRatio: 0.5,
  stableResetMs: 10_000,
};

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

function coinbaseProduct(product: string): string {
  return product.toUpperCase();
}

function binanceSymbol(product: string): string {
  const compact = product.toUpperCase().replace(/[-_/]/g, '');
  if (compact.endsWith('USD')) return `${compact.slice(0, -3)}USDT`;
  return compact;
}

function resetUpdates(): ReadonlyMap<Grip<any>, any> {
  return new Map<Grip<any>, any>([
    [COIN_PRICE_USD as Grip<any>, undefined],
    [COIN_VOLUME as Grip<any>, undefined],
    [COIN_EXCHANGE as Grip<any>, ''],
    [COIN_STATUS as Grip<any>, 'idle'],
    [COIN_UPDATED_AT as Grip<any>, undefined],
  ]);
}

async function* websocketJsonStream<T>(
  url: string,
  signal: AbortSignal,
  onOpen?: (socket: WebSocket) => void,
): AsyncIterable<T> {
  const WebSocketCtor = globalThis.WebSocket;
  if (!WebSocketCtor) throw new Error('WebSocket is not available');

  const socket = new WebSocketCtor(url);
  const queue: T[] = [];
  let closed = false;
  let error: unknown;
  let wake: (() => void) | undefined;

  const notify = () => {
    const current = wake;
    wake = undefined;
    current?.();
  };

  socket.addEventListener('open', () => onOpen?.(socket));
  socket.addEventListener('message', (event) => {
    try {
      queue.push(JSON.parse(String(event.data)) as T);
      notify();
    } catch (cause) {
      error = cause;
      socket.close();
      notify();
    }
  });
  socket.addEventListener('error', () => {
    error = new Error(`WebSocket failed: ${url}`);
    notify();
  });
  socket.addEventListener('close', () => {
    closed = true;
    notify();
  });

  signal.addEventListener(
    'abort',
    () => {
      closed = true;
      socket.close();
      notify();
    },
    { once: true },
  );

  while (!signal.aborted) {
    if (queue.length) {
      yield queue.shift()!;
      continue;
    }
    if (error) throw error;
    if (closed) return;
    await new Promise<void>((resolve) => {
      wake = resolve;
    });
  }
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

async function* coinbaseTickerStream(product: string, signal: AbortSignal): AsyncIterable<CoinTick> {
  const productId = coinbaseProduct(product);
  for await (const message of websocketJsonStream<any>(
    'wss://ws-feed.exchange.coinbase.com',
    signal,
    (socket) => {
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          product_ids: [productId],
          channels: ['ticker'],
        }),
      );
    },
  )) {
    if (message?.type !== 'ticker') continue;
    const price = Number(message.price);
    if (!Number.isFinite(price)) continue;
    const volume = Number(message.last_size ?? message.volume_24h ?? 0);
    yield {
      price,
      volume: Number.isFinite(volume) ? volume : 0,
      exchange: 'Coinbase',
      status: 'streaming',
      updatedAt: message.time ? new Date(message.time) : new Date(),
    };
  }
}

async function* binanceTickerStream(product: string, signal: AbortSignal): AsyncIterable<CoinTick> {
  const streamName = `${binanceSymbol(product).toLowerCase()}@ticker`;
  for await (const message of websocketJsonStream<any>(
    `wss://stream.binance.com:9443/ws/${streamName}`,
    signal,
  )) {
    const price = Number(message?.c);
    if (!Number.isFinite(price)) continue;
    const volume = Number(message?.v ?? 0);
    yield {
      price,
      volume: Number.isFinite(volume) ? volume : 0,
      exchange: 'Binance',
      status: 'streaming',
      updatedAt: message?.E ? new Date(Number(message.E)) : new Date(),
    };
  }
}

export function createMockCoinTap(): Tap {
  // Destination parameters select the product for each consumer. Stream startup,
  // updates, and cancellation are handled here and by the shared tap machinery.
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
    getResetUpdates: resetUpdates,
  });
}

function createLiveCoinTap(
  exchange: string,
  stream: (product: string, signal: AbortSignal) => AsyncIterable<CoinTick>,
): Tap {
  return createAsyncStreamMultiTap<CoinOuts, CoinTick>({
    provides: COIN_TICK_OUTPUTS,
    destinationParamGrips: [COIN_PRODUCT],
    cleanupDelayMs: 250,
    retry: STREAM_RETRY,
    requestKeyOf: (params) => productFromParams(params),
    subscribe: (params, signal) => {
      const product = productFromParams(params);
      if (!product) throw new Error(`Missing ${exchange} product`);
      return stream(product, signal);
    },
    mapEvent: (_params, tick) =>
      new Map<Grip<any>, any>([
        [COIN_PRICE_USD as Grip<any>, tick.price],
        [COIN_VOLUME as Grip<any>, tick.volume],
        [COIN_EXCHANGE as Grip<any>, tick.exchange],
        [COIN_STATUS as Grip<any>, tick.status],
        [COIN_UPDATED_AT as Grip<any>, tick.updatedAt],
      ]),
    getResetUpdates: resetUpdates,
    onError: (error, requestKey) => {
      console.warn(`[${exchange}] stream error for ${requestKey}`, error);
    },
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

class LiveCoinTapFactory implements TapFactory {
  readonly kind = 'TapFactory' as const;
  readonly provides = COIN_TICK_OUTPUTS;
  private readonly exchange: string;
  private readonly stream: (product: string, signal: AbortSignal) => AsyncIterable<CoinTick>;

  constructor(
    exchange: string,
    stream: (product: string, signal: AbortSignal) => AsyncIterable<CoinTick>,
  ) {
    this.exchange = exchange;
    this.stream = stream;
  }

  build(): Tap {
    return createLiveCoinTap(this.exchange, this.stream);
  }
}

export const COINBASE_TAP_FACTORY = new LiveCoinTapFactory('Coinbase', coinbaseTickerStream);
export const BINANCE_TAP_FACTORY = new LiveCoinTapFactory('Binance', binanceTickerStream);
