'use client';

import { useStockFearGreed } from '@/hooks/useStockFearGreed';
import { FearGreedGauge } from './FearGreedGauge';

export function StockFearGreed() {
  const { fng, vix, isLoading } = useStockFearGreed();

  const subtitle = vix !== undefined
    ? `VIX: ${vix.toFixed(2)}`
    : 'Stock Fear & Greed (VIX)';

  return (
    <FearGreedGauge
      title="美股情緒"
      value={fng?.value ?? 50}
      label={fng?.value_classification ?? '—'}
      subtitle={subtitle}
      isLoading={isLoading && !fng}
    />
  );
}
