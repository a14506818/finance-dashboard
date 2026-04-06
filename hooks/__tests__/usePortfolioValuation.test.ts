import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Position, CategoryConfig } from '@/lib/types';

// Mock all sub-hooks
vi.mock('../useCryptoPrices');
vi.mock('../useUSStocks');
vi.mock('../useTaiwanStocks');
vi.mock('../useExchangeRate');

import { useCryptoPrices } from '../useCryptoPrices';
import { useUSStocks } from '../useUSStocks';
import { useTaiwanStocks } from '../useTaiwanStocks';
import { useExchangeRate } from '../useExchangeRate';
import { usePortfolioValuation } from '../usePortfolioValuation';

const mockCrypto  = vi.mocked(useCryptoPrices);
const mockUS      = vi.mocked(useUSStocks);
const mockTW      = vi.mocked(useTaiwanStocks);
const mockFX      = vi.mocked(useExchangeRate);

const USD_TWD = 32;

const defaultCategories: CategoryConfig[] = [
  { market: 'crypto', name: '加密貨幣', targetPercent: 0 },
  { market: 'us',     name: '美股',     targetPercent: 0 },
  { market: 'taiwan', name: '台股',     targetPercent: 0 },
  { market: 'cash',   name: '現金',     targetPercent: 0 },
  { market: 'manual', name: '手動',     targetPercent: 0 },
];

beforeEach(() => {
  mockCrypto.mockReturnValue({ quotes: [], isLoading: false, error: undefined });
  mockUS.mockReturnValue({ stocks: [], isLoading: false, error: undefined });
  mockTW.mockReturnValue({ stocks: [], isLoading: false, error: undefined });
  mockFX.mockReturnValue({ usdToTwd: USD_TWD, isLoading: false, error: undefined });
});

// ─── Valuation math ──────────────────────────────────────────────────────────

describe('valuation calculation', () => {
  it('computes USD crypto valuation correctly', () => {
    mockCrypto.mockReturnValue({
      quotes: [{ symbol: 'BTC', name: 'Bitcoin', usd: 50000, usd_24h_change: 0 }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: 'BTC', market: 'crypto', quantity: 2 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].valuation).toBe(100000); // 2 * 50000
    expect(result.current.items[0].valuationTWD).toBe(100000 * USD_TWD);
    expect(result.current.totalValuation).toBe(100000);
  });

  it('computes US stock valuation correctly', () => {
    mockUS.mockReturnValue({
      stocks: [{ symbol: 'AAPL', name: 'Apple', price: 200, currency: 'USD', change: 0, changePercent: 0, marketClosed: false }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].valuation).toBe(2000);
    expect(result.current.totalValuation).toBe(2000);
  });

  it('computes TWD stock valuation and converts to USD', () => {
    mockTW.mockReturnValue({
      stocks: [{ symbol: '0050', name: 'ETF', price: 160, currency: 'TWD', change: 0, changePercent: 0, marketClosed: false }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: '0050', market: 'taiwan', quantity: 100 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const valuationTWD = 100 * 160; // 16000
    const valuationUSD = valuationTWD / USD_TWD; // 500
    expect(result.current.items[0].valuationTWD).toBe(valuationTWD);
    expect(result.current.items[0].valuation).toBeCloseTo(valuationUSD);
  });

  it('computes allocation percentage correctly', () => {
    mockUS.mockReturnValue({
      stocks: [
        { symbol: 'AAPL', name: 'Apple', price: 100, currency: 'USD', change: 0, changePercent: 0, marketClosed: false },
        { symbol: 'GOOG', name: 'Google', price: 300, currency: 'USD', change: 0, changePercent: 0, marketClosed: false },
      ],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [
      { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 }, // $100 = 25%
      { id: 'p2', symbol: 'GOOG', market: 'us', quantity: 1 }, // $300 = 75%
    ];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].percent).toBeCloseTo(25);
    expect(result.current.items[1].percent).toBeCloseTo(75);
  });

  it('handles manual positions using manualValue directly', () => {
    const positions: Position[] = [
      { id: 'p1', symbol: 'Cash', market: 'manual', quantity: 1, manualValue: 5000, manualCurrency: 'USD' },
    ];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].valuation).toBe(5000);
    expect(result.current.items[0].valuationTWD).toBe(5000 * USD_TWD);
  });

  it('handles manual TWD positions and converts to USD', () => {
    const positions: Position[] = [
      { id: 'p1', symbol: 'Cash', market: 'manual', quantity: 1, manualValue: 32000, manualCurrency: 'TWD' },
    ];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].valuationTWD).toBe(32000);
    expect(result.current.items[0].valuation).toBeCloseTo(1000); // 32000 / 32
  });
});

// ─── P&L calculation ─────────────────────────────────────────────────────────

describe('P&L calculation', () => {
  it('calculates unrealized P&L from buy lots', () => {
    mockUS.mockReturnValue({
      stocks: [{ symbol: 'AAPL', name: 'Apple', price: 200, currency: 'USD', change: 0, changePercent: 0, marketClosed: false }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{
      id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
      lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
    }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const item = result.current.items[0];
    expect(item.costBasis).toBe(1500);       // 10 * 150
    expect(item.unrealizedPL).toBe(500);     // 2000 - 1500
    expect(item.unrealizedPLPercent).toBeCloseTo(33.33, 1);
    expect(item.unrealizedPLTWD).toBe(500 * USD_TWD);
  });

  it('subtracts sell proceeds from net cost basis', () => {
    mockUS.mockReturnValue({
      stocks: [{ symbol: 'AAPL', name: 'Apple', price: 200, currency: 'USD', change: 0, changePercent: 0, marketClosed: false }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{
      id: 'p1', symbol: 'AAPL', market: 'us', quantity: 8,
      lots: [
        { id: 'l1', type: 'buy',  quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }, // cost: 1500
        { id: 'l2', type: 'sell', quantity: 2,  price: 180, currency: 'USD', date: '2024-02-01' }, // proceeds: 360
      ],
    }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const item = result.current.items[0];
    expect(item.costBasis).toBe(1500);                // total buy cost (not adjusted)
    // netCostBasis = 1500 - 360 = 1140, valuation = 8 * 200 = 1600
    expect(item.unrealizedPL).toBeCloseTo(1600 - 1140);  // 460
  });

  it('returns no P&L fields when position has no lots', () => {
    mockUS.mockReturnValue({
      stocks: [{ symbol: 'AAPL', name: 'Apple', price: 200, currency: 'USD', change: 0, changePercent: 0, marketClosed: false }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: 'AAPL', market: 'us', quantity: 5 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    expect(result.current.items[0].costBasis).toBeUndefined();
    expect(result.current.items[0].unrealizedPL).toBeUndefined();
  });
});

// ─── Category summaries ───────────────────────────────────────────────────────

describe('category summaries', () => {
  it('groups items into correct category', () => {
    mockCrypto.mockReturnValue({
      quotes: [{ symbol: 'BTC', name: 'Bitcoin', usd: 50000, usd_24h_change: 0 }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: 'BTC', market: 'crypto', quantity: 1 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const cryptoCat = result.current.categorySummaries.find((c) => c.market === 'crypto')!;
    expect(cryptoCat.items).toHaveLength(1);
    expect(cryptoCat.categoryValuation).toBe(50000);
  });

  it('aggregates P&L across category items', () => {
    mockUS.mockReturnValue({
      stocks: [
        { symbol: 'AAPL', name: 'Apple', price: 200, currency: 'USD', change: 0, changePercent: 0, marketClosed: false },
        { symbol: 'GOOG', name: 'Google', price: 300, currency: 'USD', change: 0, changePercent: 0, marketClosed: false },
      ],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [
      { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
        lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }] },
      { id: 'p2', symbol: 'GOOG', market: 'us', quantity: 5,
        lots: [{ id: 'l2', type: 'buy', quantity: 5, price: 250, currency: 'USD', date: '2024-01-01' }] },
    ];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const usCat = result.current.categorySummaries.find((c) => c.market === 'us')!;
    expect(usCat.categoryCostBasis).toBe(1500 + 1250); // 2750
    // AAPL PL: 2000-1500=500, GOOG PL: 1500-1250=250
    expect(usCat.categoryUnrealizedPL).toBeCloseTo(750);
  });

  it('reports undefined category P&L when no items have lots', () => {
    mockCrypto.mockReturnValue({
      quotes: [{ symbol: 'BTC', name: 'Bitcoin', usd: 50000, usd_24h_change: 0 }],
      isLoading: false,
      error: undefined,
    });

    const positions: Position[] = [{ id: 'p1', symbol: 'BTC', market: 'crypto', quantity: 1 }];
    const { result } = renderHook(() => usePortfolioValuation(positions, defaultCategories));

    const cat = result.current.categorySummaries.find((c) => c.market === 'crypto')!;
    expect(cat.categoryCostBasis).toBeUndefined();
    expect(cat.categoryUnrealizedPL).toBeUndefined();
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe('isLoading', () => {
  it('is true when any sub-hook is loading', () => {
    mockCrypto.mockReturnValue({ quotes: [], isLoading: true, error: undefined });

    const { result } = renderHook(() => usePortfolioValuation([], defaultCategories));
    expect(result.current.isLoading).toBe(true);
  });

  it('is false when all sub-hooks have data', () => {
    const { result } = renderHook(() => usePortfolioValuation([], defaultCategories));
    expect(result.current.isLoading).toBe(false);
  });
});
