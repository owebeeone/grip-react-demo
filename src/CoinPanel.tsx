import { GripScope } from '@owebeeone/grip-react';
import CoinColumn from './CoinColumn';
import { initCoinColumn } from './coinScope';

export default function CoinPanel() {
  return (
    <div>
      <div className="example-columns">
        <GripScope scopeKey="coin-column:left" init={ctx => initCoinColumn(ctx, 'BTC-USD')}>
          <CoinColumn title="Market A" />
        </GripScope>
        <GripScope scopeKey="coin-column:right" init={ctx => initCoinColumn(ctx, 'ETH-USD')}>
          <CoinColumn title="Market B" />
        </GripScope>
      </div>
    </div>
  );
}
