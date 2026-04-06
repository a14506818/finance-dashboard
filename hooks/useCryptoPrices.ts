'use client';

import type { CryptoQuote } from '@/lib/types';
import { CRYPTO_META, REFRESH_INTERVALS } from '@/lib/constants';
import { readCache, writeCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';
import { useCachedSWR } from './useCachedSWR';

type CoinGeckoRaw = Record<string, Record<string, number>>;

export function useCryptoPrices(ids: string[]) {
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });
  const url = `https://api.coingecko.com/api/v3/simple/price?${params}`;

  const { data: effectiveData, error, isLoading } = useCachedSWR<CoinGeckoRaw>(
    ids.length ? url : null,
    () => readCache<CoinGeckoRaw>(PRICE_CACHE_KEYS.crypto),
    {
      refreshInterval: REFRESH_INTERVALS.CRYPTO_PRICES,
      dedupingInterval: 15_000,
      onSuccess: (newData) => {
        const existing = readCache<CoinGeckoRaw>(PRICE_CACHE_KEYS.crypto) ?? {};
        writeCache(PRICE_CACHE_KEYS.crypto, { ...existing, ...newData });
      },
    },
  );

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
    error,
    isLoading,
  };
}
