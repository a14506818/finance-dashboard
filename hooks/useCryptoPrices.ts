'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { CryptoQuote } from '@/lib/types';
import { CRYPTO_META, REFRESH_INTERVALS } from '@/lib/constants';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';

type CoinGeckoRaw = Record<string, Record<string, number>>;

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

export function useCryptoPrices(ids: string[]) {
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });
  const url = `https://api.coingecko.com/api/v3/simple/price?${params}`;

  // Read cached data AFTER hydration to avoid SSR/client mismatch
  const [cachedData, setCachedData] = useState<CoinGeckoRaw | null>(null);
  useEffect(() => {
    setCachedData(readCache<CoinGeckoRaw>(PRICE_CACHE_KEYS.crypto));
  }, []);

  const { data, error, isLoading } = useSWR<CoinGeckoRaw>(
    ids.length ? url : null,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVALS.CRYPTO_PRICES,
      revalidateOnFocus: true,
      dedupingInterval: 15_000,
      onSuccess: (newData) => {
        const existing = readCache<CoinGeckoRaw>(PRICE_CACHE_KEYS.crypto) ?? {};
        writeCache(PRICE_CACHE_KEYS.crypto, { ...existing, ...newData });
      },
    }
  );

  // Use live data if available, otherwise fall back to cached (set after mount)
  const effectiveData = data ?? cachedData;

  const quotes: CryptoQuote[] = ids.map((id) => {
    const entry = effectiveData?.[id] ?? {};
    const meta = CRYPTO_META[id] ?? { symbol: id.toUpperCase(), name: id };
    return {
      id,
      symbol: meta.symbol,
      name: meta.name,
      usd: entry['usd'] ?? 0,
      usd_24h_change: entry['usd_24h_change'] ?? 0,
    };
  });

  return {
    quotes: effectiveData ? quotes : [],
    error: error as Error | undefined,
    // Only "loading" when we have no data at all (no live data AND no cache)
    isLoading: isLoading && !effectiveData,
  };
}
