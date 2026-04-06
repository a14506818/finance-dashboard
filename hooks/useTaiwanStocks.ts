'use client';

import type { StockQuote } from '@/lib/types';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';
import { useCachedSWR } from './useCachedSWR';

/**
 * @param twseKeys  Optional array of TWSE query keys (e.g. ['tse_0050.tw', 'otc_6509.tw']).
 *                  Omit to fetch the dashboard default (0050, 0056).
 */
export function useTaiwanStocks(twseKeys?: string[]) {
  const swrKey =
    twseKeys && twseKeys.length > 0
      ? `/api/taiwan-stocks?symbols=${twseKeys.join(',')}`
      : '/api/taiwan-stocks';

  const { data, error, isLoading } = useCachedSWR<StockQuote[]>(
    swrKey,
    () => {
      const map = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.twMap);
      return map ? Object.values(map) : null;
    },
    {
      refreshInterval: REFRESH_INTERVALS.TAIWAN_STOCKS,
      dedupingInterval: 10_000,
      onSuccess: (stocks) => {
        const existing = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.twMap) ?? {};
        const updated = { ...existing };
        for (const s of stocks) updated[s.symbol] = s;
        writeCache(PRICE_CACHE_KEYS.twMap, updated);
      },
    },
  );

  return {
    stocks: data ?? [],
    error,
    isLoading,
  };
}
