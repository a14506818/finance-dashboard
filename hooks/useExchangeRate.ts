'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { StockQuote } from '@/lib/types';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';
import { fetcher } from '@/lib/fetcher';

const FALLBACK_USD_TWD = 32;

/**
 * Fetches the current USD/TWD exchange rate via Yahoo Finance (TWD=X).
 * Returns TWD per 1 USD.
 * Falls back to: last cached rate → hardcoded 32.
 */
export function useExchangeRate() {
  // Read cached rate AFTER hydration to avoid SSR/client mismatch
  const [cachedRate, setCachedRate] = useState<number | null>(null);
  useEffect(() => {
    setCachedRate(readCache<number>(PRICE_CACHE_KEYS.fxRate));
  }, []);

  const { data, error, isLoading } = useSWR<StockQuote[]>(
    '/api/us-stocks?symbols=TWD%3DX',
    fetcher,
    {
      refreshInterval: 5 * 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      onSuccess: (quotes) => {
        const rate = quotes.find((s) => s.symbol === 'TWD=X')?.price;
        if (rate) writeCache(PRICE_CACHE_KEYS.fxRate, rate);
      },
    }
  );

  // Priority: live API → last cached (set after mount) → hardcoded fallback
  const liveRate = data?.find((s) => s.symbol === 'TWD=X')?.price;
  const rate = liveRate ?? cachedRate ?? FALLBACK_USD_TWD;

  return {
    usdToTwd: rate,
    // Only "loading" when we have no rate at all (no live data AND no cache AND not yet fallen back)
    isLoading: isLoading && !liveRate && !cachedRate,
    error: error as Error | undefined,
  };
}
