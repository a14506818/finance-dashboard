'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrice, formatChange, formatPercent } from '@/lib/formatters';
import { useSettings } from '@/hooks/useSettings';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { gainColor, gainBadgeClass } from '@/lib/colors';

interface AssetCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  marketClosed?: boolean;
  isLoading?: boolean;
  error?: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${className ?? ''}`} />
  );
}

export function AssetCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  currency = 'USD',
  marketClosed,
  isLoading,
  error,
}: AssetCardProps) {
  const { settings } = useSettings();
  const { usdToTwd } = useExchangeRate();
  const convention = settings.redGreenConvention ?? 'western';
  const preferredCurrency = settings.preferredCurrency ?? 'USD';
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  // Dual currency price
  const priceUSD = currency === 'TWD' ? (usdToTwd > 0 ? price / usdToTwd : 0) : price;
  const priceTWD = currency === 'TWD' ? price : price * usdToTwd;
  const [primaryPrice, primaryCur, secondaryPrice, secondaryCur] =
    preferredCurrency === 'TWD'
      ? [priceTWD, 'TWD' as const, priceUSD, 'USD' as const]
      : [priceUSD, 'USD' as const, priceTWD, 'TWD' as const];

  // Dual currency change
  const changeUSD = currency === 'TWD' ? (usdToTwd > 0 ? change / usdToTwd : 0) : change;
  const changeTWD = currency === 'TWD' ? change : change * usdToTwd;
  const [primaryChange, primaryChangeCur] =
    preferredCurrency === 'TWD'
      ? [changeTWD, 'TWD' as const]
      : [changeUSD, 'USD' as const];

  const showSecondary = usdToTwd > 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 p-5">
        <p className="text-sm text-red-500">Failed to load {symbol}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {symbol}
          </span>
          {marketClosed && (
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600">
              (closed)
            </span>
          )}
        </div>
        {isNeutral ? (
          <Minus className="w-4 h-4 text-zinc-400" />
        ) : isPositive ? (
          <TrendingUp className={`w-4 h-4 ${gainColor(true, convention)}`} />
        ) : (
          <TrendingDown className={`w-4 h-4 ${gainColor(false, convention)}`} />
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2 truncate">{name}</p>

      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight">
        {formatPrice(primaryPrice, primaryCur)}
      </p>
      {showSecondary && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums mt-0.5">
          {formatPrice(secondaryPrice, secondaryCur)}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-sm font-medium tabular-nums ${
            isNeutral ? 'text-zinc-400' : gainColor(isPositive, convention)
          }`}
        >
          {formatChange(primaryChange, primaryChangeCur)}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium tabular-nums ${
            isNeutral
              ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              : gainBadgeClass(isPositive, convention)
          }`}
        >
          {formatPercent(changePercent)}
        </span>
      </div>
    </div>
  );
}
