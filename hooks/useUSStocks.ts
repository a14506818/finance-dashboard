'use client';

import type { StockQuote } from '@/lib/types';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';
import { useCachedSWR } from './useCachedSWR';

export function useUSStocks(symbols: string[]) {
  const swrKey =
    symbols.length > 0 ? `/api/us-stocks?symbols=${symbols.join(',')}` : null;

  const { data, error, isLoading } = useCachedSWR<StockQuote[]>(
    swrKey,
    () => {
      const map = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.usMap);
      return map ? Object.values(map) : null;
    },
    {
      refreshInterval: REFRESH_INTERVALS.US_STOCKS,
      dedupingInterval: 10_000,
      onSuccess: (stocks) => {
        const existing = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.usMap) ?? {};
        const updated = { ...existing };
        for (const s of stocks) updated[s.symbol] = s;
        writeCache(PRICE_CACHE_KEYS.usMap, updated);
      },
    },
  );

  return {
    stocks: data ?? [],
    error,
    isLoading,
  };
}
