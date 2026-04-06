'use client';

import { useMemo } from 'react';
import type { Position, ValuatedPosition, CategoryConfig, CategorySummary } from '@/lib/types';
import { useCryptoPrices } from './useCryptoPrices';
import { useUSStocks } from './useUSStocks';
import { useTaiwanStocks } from './useTaiwanStocks';
import { useExchangeRate } from './useExchangeRate';
import { CRYPTO_SYMBOL_TO_ID } from '@/lib/constants';

function toUSD(amount: number, currency: 'USD' | 'TWD', usdToTwd: number): number {
  return currency === 'TWD' ? amount / usdToTwd : amount;
}

/**
 * Returns the effective quantity for a position:
 * - If the position has lots: sum(buy qty) - sum(sell qty) + adjustedQuantity
 * - If no lots: fall back to position.quantity (backward compatibility)
 */
export function getEffectiveQuantity(pos: Position): number {
  if (!pos.lots?.length) return pos.quantity;
  const lotsQty = pos.lots.reduce(
    (s, l) => s + (l.type === 'buy' ? l.quantity : -l.quantity),
    0
  );
  return lotsQty + (pos.adjustedQuantity ?? 0);
}

function calcPL(pos: Position, valuation: number, usdToTwd: number) {
  if (!pos.lots?.length || pos.market === 'cash') return {};

  const buys = pos.lots.filter((t) => t.type === 'buy');
  const sells = pos.lots.filter((t) => t.type === 'sell');

  const totalBuyCost     = buys.reduce((s, t) => s + toUSD(t.price * t.quantity, t.currency, usdToTwd), 0);
  const totalSellProceeds = sells.reduce((s, t) => s + toUSD(t.price * t.quantity, t.currency, usdToTwd), 0);

  if (totalBuyCost <= 0) return {};

  // Net cost basis after accounting for sold proceeds
  const netCostBasis = totalBuyCost - totalSellProceeds;
  const unrealizedPL = valuation - netCostBasis;

  return {
    costBasis: totalBuyCost,
    unrealizedPL,
    unrealizedPLPercent: netCostBasis > 0 ? (unrealizedPL / netCostBasis) * 100 : 0,
    unrealizedPLTWD: unrealizedPL * usdToTwd,
  };
}

export function usePortfolioValuation(positions: Position[], categories: CategoryConfig[]) {
  // Collect symbols per market (exclude manual — no price lookup needed)
  const cryptoIds = useMemo(
    () =>
      positions
        .filter((p) => p.market === 'crypto')
        .map((p) => CRYPTO_SYMBOL_TO_ID[p.symbol] ?? p.symbol.toLowerCase())
        .filter((v, i, a) => a.indexOf(v) === i),
    [positions]
  );

  const usSymbols = useMemo(
    () =>
      positions
        .filter((p) => p.market === 'us')
        .map((p) => p.symbol)
        .filter((v, i, a) => a.indexOf(v) === i),
    [positions]
  );

  const twseKeys = useMemo(
    () =>
      positions
        .filter((p) => p.market === 'taiwan')
        .map((p) => `${p.twExchange ?? 'tse'}_${p.symbol}.tw`)
        .filter((v, i, a) => a.indexOf(v) === i),
    [positions]
  );

  // Fetch prices
  const { quotes: cryptoQuotes, isLoading: cryptoLoading } = useCryptoPrices(cryptoIds);
  const { stocks: usStocks, isLoading: usLoading } = useUSStocks(usSymbols);
  const { stocks: twStocks, isLoading: twLoading } = useTaiwanStocks(twseKeys);
  const { usdToTwd, isLoading: fxLoading } = useExchangeRate();

  const isLoading = cryptoLoading || usLoading || twLoading || fxLoading;

  // Build price map: symbol → { price, currency, name }
  const priceMap = useMemo(() => {
    const map: Record<string, { price: number; currency: string; name: string }> = {};
    for (const q of cryptoQuotes) map[q.symbol] = { price: q.usd, currency: 'USD', name: q.name };
    for (const s of usStocks) map[s.symbol] = { price: s.price, currency: s.currency, name: s.name };
    for (const s of twStocks) map[s.symbol] = { price: s.price, currency: 'TWD', name: s.name };
    return map;
  }, [cryptoQuotes, usStocks, twStocks]);

  // Calculate valuations
  const { items, totalValuation, totalValuationTWD } = useMemo(() => {
    const items: ValuatedPosition[] = positions.map((pos) => {
      // Manual/cash positions: use directly entered value, no market price lookup
      if (pos.market === 'manual' || pos.market === 'cash') {
        const mv = pos.manualValue ?? 0;
        const mc = pos.manualCurrency ?? 'USD';
        const valuation    = mc === 'TWD' ? mv / usdToTwd : mv;
        const valuationTWD = mc === 'TWD' ? mv : mv * usdToTwd;
        const plFields = calcPL(pos, valuation, usdToTwd);
        return { position: pos, name: pos.symbol, price: mv, currency: mc,
                 valuation, valuationTWD, percent: 0, ...plFields };
      }

      const entry = priceMap[pos.symbol];
      const price = entry?.price ?? 0;
      const currency = entry?.currency ?? 'USD';
      const name = entry?.name ?? pos.symbol;
      const quantity = getEffectiveQuantity(pos);
      const rawValue = quantity * price;

      // Normalize to USD for total
      const valuation = currency === 'TWD' ? rawValue / usdToTwd : rawValue;
      // Always provide TWD equivalent
      const valuationTWD = currency === 'TWD' ? rawValue : rawValue * usdToTwd;
      const plFields = calcPL(pos, valuation, usdToTwd);

      return { position: pos, name, price, currency, valuation, valuationTWD, percent: 0, ...plFields };
    });

    const total = items.reduce((sum, i) => sum + i.valuation, 0);
    const totalTWD = items.reduce((sum, i) => sum + i.valuationTWD, 0);

    for (const item of items) {
      item.percent = total > 0 ? (item.valuation / total) * 100 : 0;
    }

    return { items, totalValuation: total, totalValuationTWD: totalTWD };
  }, [positions, priceMap, usdToTwd]);

  const categorySummaries: CategorySummary[] = useMemo(() =>
    categories.map((cat) => {
      const catItems = items.filter((i) => (i.position.category ?? i.position.market) === cat.market);
      const catVal = catItems.reduce((s, i) => s + i.valuation, 0);
      const catValTWD = catItems.reduce((s, i) => s + i.valuationTWD, 0);
      const catPct = totalValuation > 0 ? (catVal / totalValuation) * 100 : 0;

      const hasAnyPL = catItems.some((i) => i.costBasis != null);
      const categoryCostBasis    = hasAnyPL ? catItems.reduce((s, i) => s + (i.costBasis    ?? 0), 0) : undefined;
      const categoryUnrealizedPL    = hasAnyPL ? catItems.reduce((s, i) => s + (i.unrealizedPL    ?? 0), 0) : undefined;
      const categoryUnrealizedPLTWD = hasAnyPL ? catItems.reduce((s, i) => s + (i.unrealizedPLTWD ?? 0), 0) : undefined;

      return {
        market: cat.market,
        name: cat.name,
        targetPercent: cat.targetPercent,
        items: catItems,
        categoryValuation: catVal,
        categoryValuationTWD: catValTWD,
        categoryPercent: catPct,
        diff: catPct - cat.targetPercent,
        categoryCostBasis,
        categoryUnrealizedPL,
        categoryUnrealizedPLTWD,
      };
    }),
  [categories, items, totalValuation]);

  return { items, categorySummaries, totalValuation, totalValuationTWD, usdToTwd, isLoading };
}
