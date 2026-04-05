'use client';

import { useMemo } from 'react';
import { useTaiwanStocks } from '@/hooks/useTaiwanStocks';
import { TAIWAN_SYMBOL_MAP } from '@/lib/constants';
import { AssetCard } from './AssetCard';

interface TaiwanStocksSectionProps {
  symbols?: string[];  // display symbols e.g. ['0050', '0056']
}

export function TaiwanStocksSection({ symbols }: TaiwanStocksSectionProps) {
  const twseKeys = useMemo(() => {
    if (!symbols || symbols.length === 0) return undefined;
    return symbols
      .map((s) => TAIWAN_SYMBOL_MAP[s]?.key ?? `tse_${s}.tw`)
      .filter(Boolean);
  }, [symbols]);

  const { stocks, isLoading, error } = useTaiwanStocks(twseKeys);

  const defaultPlaceholders = [{ symbol: '0050' }, { symbol: '0056' }];
  const customPlaceholders = symbols?.map((s) => ({ symbol: s })) ?? defaultPlaceholders;
  // Show skeleton cards while loading
  const placeholders = isLoading && stocks.length === 0 ? customPlaceholders : [];

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
        台股 ETF
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {placeholders.map((p) => (
          <AssetCard
            key={p.symbol}
            symbol={p.symbol}
            name=""
            price={0}
            change={0}
            changePercent={0}
            isLoading
          />
        ))}
        {stocks.map((stock) => (
          <AssetCard
            key={stock.symbol}
            symbol={stock.symbol}
            name={stock.name}
            price={stock.price}
            change={stock.change}
            changePercent={stock.changePercent}
            currency={stock.currency}
            marketClosed={stock.marketClosed}
            error={!!error}
          />
        ))}
      </div>
    </section>
  );
}
