import {
  useAtomValueTap,
  useGrip,
  useKeyedMatchingContext,
  withOneOf,
  type MatchingContext,
} from '@owebeeone/grip-react';
import { MOCK_COIN_TAP_FACTORY } from './cointaps';
import {
  COIN_EXCHANGE,
  COIN_PRICE_USD,
  COIN_PRODUCT,
  COIN_PRODUCT_TAP,
  COIN_SOURCE,
  COIN_SOURCE_TAP,
  COIN_STATUS,
  COIN_UPDATED_AT,
  COIN_VOLUME,
  type CoinSource,
} from './grips.coin';

const PRODUCTS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'];

function initCoinMatcher(ctx: MatchingContext): void {
  ctx.addBinding({
    id: 'mock-coin',
    query: withOneOf(COIN_SOURCE, 'mock', 10).build(),
    tap: MOCK_COIN_TAP_FACTORY,
    baseScore: 5,
  });
}

function formatPrice(value: number | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatVolume(value: number | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatTime(value: Date | undefined): string {
  return value ? value.toLocaleTimeString() : '-';
}

export default function CoinColumn(props: {
  columnId: string;
  title: string;
  initialProduct: string;
}) {
  const ctx = useKeyedMatchingContext(`coin:${props.columnId}`, { init: initCoinMatcher });

  const sourceTap = useAtomValueTap(COIN_SOURCE, {
    ctx,
    initial: 'mock' satisfies CoinSource,
    tapGrip: COIN_SOURCE_TAP,
  });
  const productTap = useAtomValueTap(COIN_PRODUCT, {
    ctx,
    initial: props.initialProduct,
    tapGrip: COIN_PRODUCT_TAP,
  });

  const source = useGrip(COIN_SOURCE, ctx);
  const product = useGrip(COIN_PRODUCT, ctx);
  const price = useGrip(COIN_PRICE_USD, ctx);
  const volume = useGrip(COIN_VOLUME, ctx);
  const exchange = useGrip(COIN_EXCHANGE, ctx);
  const status = useGrip(COIN_STATUS, ctx);
  const updatedAt = useGrip(COIN_UPDATED_AT, ctx);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{props.title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <label>
          Source{' '}
          <select value={source ?? 'mock'} onChange={(event) => sourceTap.set(event.target.value as CoinSource)}>
            <option value="mock">MockCoin</option>
          </select>
        </label>
        <label>
          Product{' '}
          <select value={product ?? props.initialProduct} onChange={(event) => productTap.set(event.target.value)}>
            {PRODUCTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 8, color: 'gray' }}>
        Feed: <strong>{exchange || '-'}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', rowGap: 6, columnGap: 8 }}>
        <div>Price</div>
        <div>{formatPrice(price)}</div>
        <div>Volume</div>
        <div>{formatVolume(volume)}</div>
        <div>Status</div>
        <div>{status ?? 'idle'}</div>
        <div>Updated</div>
        <div>{formatTime(updatedAt)}</div>
      </div>
    </div>
  );
}
