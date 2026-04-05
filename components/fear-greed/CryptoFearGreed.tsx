'use client';

import { useCryptoFearGreed } from '@/hooks/useCryptoFearGreed';
import { FearGreedGauge } from './FearGreedGauge';

export function CryptoFearGreed() {
  const { fng, isLoading } = useCryptoFearGreed();

  return (
    <FearGreedGauge
      title="加密市場情緒"
      value={fng?.value ?? 50}
      label={fng?.value_classification ?? '—'}
      subtitle="Crypto Fear & Greed"
      isLoading={isLoading && !fng}
    />
  );
}
