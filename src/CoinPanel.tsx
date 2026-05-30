import CoinColumn from './CoinColumn';

export default function CoinPanel() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: 16 }}>
        <CoinColumn columnId="left" title="Market A" initialProduct="BTC-USD" />
        <CoinColumn columnId="right" title="Market B" initialProduct="ETH-USD" />
      </div>
    </div>
  );
}
