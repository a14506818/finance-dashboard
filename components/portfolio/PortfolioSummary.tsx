'use client';

import type { CategorySummary } from '@/lib/types';
import { CATEGORY_COLORS, AMOUNT_MASK } from '@/lib/constants';

interface PortfolioSummaryProps {
  categorySummaries: CategorySummary[];
  totalValuation: number;
  totalValuationTWD: number;
  isLoading: boolean;
  preferredCurrency?: 'USD' | 'TWD';
  hideAmounts?: boolean;
}

function DonutChart({ summaries }: { summaries: CategorySummary[] }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const active = summaries.filter((s) => s.categoryValuation > 0);

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <circle
        cx={100}
        cy={100}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={28}
        className="text-zinc-100 dark:text-zinc-800"
      />
      {active.map((cat) => {
        const segLength = (cat.categoryPercent / 100) * circumference;
        const dash = `${segLength} ${circumference - segLength}`;
        const currentOffset = offset;
        offset += segLength;

        return (
          <circle
            key={cat.market}
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={CATEGORY_COLORS[cat.market]}
            strokeWidth={28}
            strokeDasharray={dash}
            strokeDashoffset={-currentOffset}
            strokeLinecap="butt"
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
          />
        );
      })}
    </svg>
  );
}

export function PortfolioSummary({
  categorySummaries,
  totalValuation,
  totalValuationTWD,
  isLoading,
  preferredCurrency = 'USD',
  hideAmounts = false,
}: PortfolioSummaryProps) {
  const active = categorySummaries.filter((s) => s.categoryValuation > 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">
        持倉總覽
      </h2>

      {active.length === 0 ? (
        <p className="text-zinc-400 dark:text-zinc-600 text-sm text-center py-8">
          新增倉位後即可查看配置
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <DonutChart summaries={categorySummaries} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">總估值</span>
              {preferredCurrency === 'TWD' ? (
                <>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight">
                    {isLoading ? '...' : hideAmounts ? AMOUNT_MASK : `NT$${Math.round(totalValuationTWD).toLocaleString()}`}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 tabular-nums">
                    {isLoading ? '' : hideAmounts ? AMOUNT_MASK : `$${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight">
                    {isLoading ? '...' : hideAmounts ? AMOUNT_MASK : `$${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 tabular-nums">
                    {isLoading ? '' : hideAmounts ? AMOUNT_MASK : `NT$${Math.round(totalValuationTWD).toLocaleString()}`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 grid grid-cols-1 gap-2 min-w-0">
            {active.map((cat) => (
              <div key={cat.market} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat.market] }}
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {cat.name}
                </span>
                <span className="ml-auto text-sm tabular-nums text-zinc-500">
                  {cat.categoryPercent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
