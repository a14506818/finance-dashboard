'use client';

import { TaiwanStocksSection } from '@/components/cards/TaiwanStocksSection';
import { USStocksSection } from '@/components/cards/USStocksSection';
import { CryptoSection } from '@/components/cards/CryptoSection';
import { CryptoFearGreed } from '@/components/fear-greed/CryptoFearGreed';
import { StockFearGreed } from '@/components/fear-greed/StockFearGreed';
import { useSettings } from '@/hooks/useSettings';

export default function Page() {
  const { settings } = useSettings();
  const { taiwan, us, crypto } = settings.dashboardSymbols;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* Fear & Greed Row */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          市場情緒
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <CryptoFearGreed />
          <StockFearGreed />
        </div>
      </section>

      {/* Price Sections */}
      <CryptoSection cryptoIds={crypto} />
      <USStocksSection symbols={us} />
      <TaiwanStocksSection symbols={taiwan} />

      {/* Footer */}
      <footer className="text-xs text-zinc-400 dark:text-zinc-600 pb-4 space-y-1">
        <p>資料來源：TWSE、Yahoo Finance、CoinGecko、Alternative.me</p>
        <p>所有價格每 60 秒更新 · 僅供參考，不構成投資建議</p>
      </footer>
    </main>
  );
}
