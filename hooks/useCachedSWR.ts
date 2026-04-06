'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface Options<T> {
  refreshInterval: number;
  dedupingInterval: number;
  revalidateOnFocus?: boolean;
  onSuccess: (data: T) => void;
}

/**
 * Shared SWR + localStorage cache pattern used by price hooks.
 * Reads cached data after hydration to avoid SSR mismatch,
 * then keeps it in sync via SWR.
 */
export function useCachedSWR<T>(
  swrKey: string | null,
  readCached: () => T | null,
  options: Options<T>,
) {
  const [cachedData, setCachedData] = useState<T | null>(null);
  useEffect(() => {
    setCachedData(readCached());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, error, isLoading } = useSWR<T>(swrKey, fetcher, {
    refreshInterval: options.refreshInterval,
    revalidateOnFocus: options.revalidateOnFocus ?? true,
    dedupingInterval: options.dedupingInterval,
    onSuccess: options.onSuccess,
  });

  return {
    data: data ?? cachedData ?? undefined,
    error: error as Error | undefined,
    isLoading: isLoading && !data && !cachedData,
  };
}
