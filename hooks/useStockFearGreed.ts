'use client';

import { useUSStocks } from './useUSStocks';
import { vixToFearGreedScore } from '@/lib/fear-greed';
import type { FearGreedData } from '@/lib/types';

// Shares the same SWR cache key as US stocks if ^VIX is in the symbols list
export function useStockFearGreed() {
  const { stocks, error, isLoading } = useUSStocks(['^VIX']);

  const vixEntry = stocks.find((s) => s.symbol === '^VIX' || s.symbol === 'VIX');
  const vix = vixEntry?.price;

  let fng: FearGreedData | undefined;
  if (vix !== undefined) {
    const value = vixToFearGreedScore(vix);
    const classifications = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];
    let idx = 4;
    if (value <= 25) idx = 0;
    else if (value <= 45) idx = 1;
    else if (value <= 55) idx = 2;
    else if (value <= 75) idx = 3;

    fng = {
      value,
      value_classification: classifications[idx],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    fng,
    vix,
    error,
    isLoading,
  };
}
