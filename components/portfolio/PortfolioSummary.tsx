'use client';

import type { CategorySummary } from '@/lib/types';
import { CATEGORY_COLORS, AMOUNT_MASK } from '@/lib/constants';
import { gainColor } from '@/lib/colors';

interface PortfolioSummaryProps {
  categorySummaries: CategorySummary[];
  totalValuation: number;
  totalValuationTWD: number;
  isLoading: boolean;
  preferredCurrency?: 'USD' | 'TWD';
  hideAmounts?: boolean;
  redGreenConvention?: 'western' | 'taiwan';
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

function fmtUSD(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtTWD(v: number) {
  return `NT$${Math.round(v).toLocaleString()}`;
}

export function PortfolioSummary({
  categorySummaries,
  totalValuation,
  totalValuationTWD,
  isLoading,
  preferredCurrency = 'USD',
  hideAmounts = false,
  redGreenConvention = 'western',
}: PortfolioSummaryProps) {
  const active = categorySummaries.filter((s) => s.categoryValuation > 0);

  // Aggregate cost & P&L across all categories
  const hasCostData = categorySummaries.some((c) => c.categoryCostBasis != null);
  const totalCostUSD = categorySummaries.reduce((s, c) => s + (c.categoryCostBasis ?? 0), 0);
  const totalPLUSD   = categorySummaries.reduce((s, c) => s + (c.categoryUnrealizedPL    ?? 0), 0);
  const totalPLTWD   = categorySummaries.reduce((s, c) => s + (c.categoryUnrealizedPLTWD ?? 0), 0);
  // Derive TWD cost using implied exchange rate from current valuation pair
  const impliedRate  = totalValuation > 0 ? totalValuationTWD / totalValuation : 1;
  const totalCostTWD = totalCostUSD * impliedRate;
  const totalPLPct   = totalCostUSD > 0 ? (totalPLUSD / totalCostUSD) * 100 : 0;

  const plPositive   = totalPLUSD >= 0;
  const plColorClass = gainColor(plPositive, redGreenConvention);
  const sign         = plPositive ? '+' : '';

  // Primary / secondary currency for cost & P&L
  const [primaryCost, secondaryCost] = preferredCurrency === 'TWD'
    ? [fmtTWD(totalCostTWD), fmtUSD(totalCostUSD)]
    : [fmtUSD(totalCostUSD), fmtTWD(totalCostTWD)];
  const [primaryPL, secondaryPL] = preferredCurrency === 'TWD'
    ? [fmtTWD(totalPLTWD), fmtUSD(totalPLUSD)]
    : [fmtUSD(totalPLUSD), fmtTWD(totalPLTWD)];

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

          {/* Legend + Cost/PL */}
          <div className="flex-1 grid grid-cols-1 gap-2 min-w-0">
            {/* Category rows */}
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

            {/* Cost & P&L — only when transaction records exist */}
            {hasCostData && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1 space-y-1.5">
                {/* Cost row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 pt-0.5 shrink-0">成本</span>
                  <div className="text-right tabular-nums">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {hideAmounts ? AMOUNT_MASK : primaryCost}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      {hideAmounts ? AMOUNT_MASK : secondaryCost}
                    </div>
                  </div>
                </div>

                {/* P&L row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 pt-0.5 shrink-0">損益</span>
                  <div className={`text-right tabular-nums ${plColorClass}`}>
                    <div className="text-sm">
                      {hideAmounts ? AMOUNT_MASK : `${sign}${primaryPL}`}
                      {/* Percentage stays visible even when amounts are hidden */}
                      <span className="text-xs opacity-70 ml-1">
                        ({sign}{totalPLPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-xs opacity-80">
                      {hideAmounts ? AMOUNT_MASK : `${sign}${secondaryPL}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
