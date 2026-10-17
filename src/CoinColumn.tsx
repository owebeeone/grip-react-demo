import { useGrip } from '@owebeeone/grip-react';
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

/**
 * Read data and mutators from the enclosing column scope. The exchange
 * connections and product-specific streams belong to providers, so changing
 * the source does not change this display's subscriptions to its grips.
 */
export default function CoinColumn(props: { title: string }) {
  const sourceTap = useGrip(COIN_SOURCE_TAP);
  const productTap = useGrip(COIN_PRODUCT_TAP);
  const source = useGrip(COIN_SOURCE);
  const product = useGrip(COIN_PRODUCT);
  const price = useGrip(COIN_PRICE_USD);
  const volume = useGrip(COIN_VOLUME);
  const exchange = useGrip(COIN_EXCHANGE);
  const status = useGrip(COIN_STATUS);
  const updatedAt = useGrip(COIN_UPDATED_AT);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{props.title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <label>
          Source{' '}
          <select value={source ?? 'mock'} onChange={(event) => sourceTap?.set(event.target.value as CoinSource)}>
            <option value="mock">MockCoin</option>
            <option value="coinbase">Coinbase</option>
            <option value="binance">Binance</option>
          </select>
        </label>
        <label>
          Product{' '}
          <select value={product ?? ''} onChange={(event) => productTap?.set(event.target.value)}>
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
