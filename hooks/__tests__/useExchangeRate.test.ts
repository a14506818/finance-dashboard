import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { writeCache, readCache, PRICE_CACHE_KEYS } from '@/lib/priceCache';

// Mock SWR before importing the hook
vi.mock('swr');
import useSWR from 'swr';
import { useExchangeRate } from '../useExchangeRate';

const mockUseSWR = vi.mocked(useSWR);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useExchangeRate', () => {
  it('returns live rate when SWR fetches successfully', async () => {
    mockUseSWR.mockReturnValue({
      data: [{ symbol: 'TWD=X', price: 31.5, name: 'TWD=X', currency: 'USD', change: 0, changePercent: 0, marketClosed: false }],
      error: undefined,
      isLoading: false,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => {
      expect(result.current.usdToTwd).toBe(31.5);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('falls back to cached rate when SWR has no data yet', async () => {
    writeCache(PRICE_CACHE_KEYS.fxRate, 30.8);
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useExchangeRate());

    // Initially may show fallback=32 before useEffect runs
    await waitFor(() => {
      // After mount, cachedRate should be set → usdToTwd = 30.8
      expect(result.current.usdToTwd).toBe(30.8);
    });
    expect(result.current.isLoading).toBe(false); // has cached data → not loading
  });

  it('falls back to hardcoded 32 when no data and no cache', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('network error'),
      isLoading: false,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useExchangeRate());

    expect(result.current.usdToTwd).toBe(32);
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading is true only when no live data, no cache, and SWR is loading', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useExchangeRate());

    // Before useEffect (no cache): isLoading should be true (SWR loading, no live, cachedRate=null)
    // cachedRate starts null, so: isLoading && !liveRate && !cachedRate = true
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes error from SWR', () => {
    const err = new Error('fetch failed');
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: err,
      isLoading: false,
    } as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useExchangeRate());
    expect(result.current.error).toBe(err);
  });
});
