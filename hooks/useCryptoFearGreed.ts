'use client';

import useSWR from 'swr';
import type { FearGreedData } from '@/lib/types';
import { REFRESH_INTERVALS } from '@/lib/constants';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

interface AlternativeResponse {
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

export function useCryptoFearGreed() {
  const { data, error, isLoading } = useSWR<AlternativeResponse>(
    'https://api.alternative.me/fng/?limit=1',
    fetcher,
    {
      refreshInterval: REFRESH_INTERVALS.CRYPTO_FNG,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const fng: FearGreedData | undefined = data?.data?.[0]
    ? {
        value: parseInt(data.data[0].value, 10),
        value_classification: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
      }
    : undefined;

  return {
    fng,
    error: error as Error | undefined,
    isLoading,
  };
}
