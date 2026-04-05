'use client';

import { useUSStocks } from '@/hooks/useUSStocks';
import { US_STOCKS } from '@/lib/constants';
import { AssetCard } from './AssetCard';

interface USStocksSectionProps {
  symbols?: string[];
}

export function USStocksSection({ symbols }: USStocksSectionProps) {
  const syms = symbols && symbols.length > 0 ? symbols : US_STOCKS;
  const { stocks, isLoading, error } = useUSStocks(syms);

  const placeholders = isLoading && stocks.length === 0 ? syms : [];

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
        美股 ETF
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {placeholders.map((sym) => (
          <AssetCard
            key={sym}
            symbol={sym}
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
            error={!!error}
          />
        ))}
      </div>
    </section>
  );
}
