'use client';

import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { CRYPTO_IDS } from '@/lib/constants';
import { AssetCard } from './AssetCard';

interface CryptoSectionProps {
  cryptoIds?: string[];
}

export function CryptoSection({ cryptoIds }: CryptoSectionProps) {
  const ids = cryptoIds && cryptoIds.length > 0 ? cryptoIds : CRYPTO_IDS;
  const { quotes, isLoading, error } = useCryptoPrices(ids);

  const placeholders = isLoading && quotes.length === 0 ? ids : [];

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
        加密貨幣
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {placeholders.map((id) => (
          <AssetCard
            key={id}
            symbol={id.toUpperCase()}
            name=""
            price={0}
            change={0}
            changePercent={0}
            isLoading
          />
        ))}
        {quotes.map((coin) => (
          <AssetCard
            key={coin.id}
            symbol={coin.symbol}
            name={coin.name}
            price={coin.usd}
            change={coin.usd_24h_change / 100 * coin.usd}
            changePercent={coin.usd_24h_change}
            currency="USD"
            error={!!error}
          />
        ))}
      </div>
    </section>
  );
}
