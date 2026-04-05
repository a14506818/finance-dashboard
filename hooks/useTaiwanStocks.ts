'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { StockQuote } from '@/lib/types';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

/**
 * @param twseKeys  Optional array of TWSE query keys (e.g. ['tse_0050.tw', 'otc_6509.tw']).
 *                  Omit to fetch the dashboard default (0050, 0056).
 */
export function useTaiwanStocks(twseKeys?: string[]) {
  const swrKey =
    twseKeys && twseKeys.length > 0
      ? `/api/taiwan-stocks?symbols=${twseKeys.join(',')}`
      : '/api/taiwan-stocks';

  // Read cached quotes AFTER hydration to avoid SSR/client mismatch
  // Cache is keyed by display symbol ('0050'), not TWSE key ('tse_0050.tw')
  const [cachedStocks, setCachedStocks] = useState<StockQuote[] | null>(null);
  useEffect(() => {
    const map = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.twMap);
    setCachedStocks(map ? Object.values(map) : null);
  }, []);

  const { data, error, isLoading } = useSWR<StockQuote[]>(swrKey, fetcher, {
    refreshInterval: REFRESH_INTERVALS.TAIWAN_STOCKS,
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
    onSuccess: (stocks) => {
      const existing = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.twMap) ?? {};
      const updated = { ...existing };
      for (const s of stocks) updated[s.symbol] = s;
      writeCache(PRICE_CACHE_KEYS.twMap, updated);
    },
  });

  // Use live data if available, otherwise fall back to cached (set after mount)
  return {
    stocks: data ?? cachedStocks ?? [],
    error: error as Error | undefined,
    isLoading,
  };
}
