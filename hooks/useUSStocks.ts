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

export function useUSStocks(symbols: string[]) {
  const key =
    symbols.length > 0
      ? `/api/us-stocks?symbols=${symbols.join(',')}`
      : null;

  // Read cached quotes AFTER hydration to avoid SSR/client mismatch
  const [cachedStocks, setCachedStocks] = useState<StockQuote[] | null>(null);
  useEffect(() => {
    const map = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.usMap);
    setCachedStocks(map ? Object.values(map) : null);
  }, []);

  const { data, error, isLoading } = useSWR<StockQuote[]>(key, fetcher, {
    refreshInterval: REFRESH_INTERVALS.US_STOCKS,
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
    onSuccess: (stocks) => {
      const existing = readCache<Record<string, StockQuote>>(PRICE_CACHE_KEYS.usMap) ?? {};
      const updated = { ...existing };
      for (const s of stocks) updated[s.symbol] = s;
      writeCache(PRICE_CACHE_KEYS.usMap, updated);
    },
  });

  // Use live data if available, otherwise fall back to cached (set after mount)
  return {
    stocks: data ?? cachedStocks ?? [],
    error: error as Error | undefined,
    // Only "loading" when we have no data at all (no live data AND no cache)
    isLoading: isLoading && !data && !cachedStocks,
  };
}
