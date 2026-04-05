'use client';

import type { CategorySummary } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface AllocationBarProps {
  categorySummaries: CategorySummary[];
}

export function AllocationBar({ categorySummaries }: AllocationBarProps) {
  const visible = categorySummaries.filter(
    (c) => c.targetPercent > 0 || c.categoryValuation > 0
  );

  if (visible.length === 0) return null;

  const hasAnyTarget = visible.some((c) => c.targetPercent > 0);
  if (!hasAnyTarget) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        配置對比（實際 vs 目標）
      </h2>
      <div className="space-y-3">
        {visible.map((cat) => {
          const actual = cat.categoryPercent;
          const target = cat.targetPercent;
          if (target === 0 && actual === 0) return null;

          const diff = actual - target;
          const color = CATEGORY_COLORS[cat.market];

          return (
            <div key={cat.market} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {cat.name}
                </span>
                <span className="text-xs tabular-nums text-zinc-400">
                  {actual.toFixed(1)}% / {target.toFixed(1)}%
                  {target > 0 && (
                    <span
                      className={`ml-1.5 ${
                        Math.abs(diff) < 1
                          ? 'text-zinc-400'
                          : diff > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      ({diff >= 0 ? '+' : ''}{diff.toFixed(1)})
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(actual, 100)}%`,
                    backgroundColor: color,
                    opacity: 0.8,
                  }}
                />
                {target > 0 && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-zinc-900 dark:bg-zinc-100"
                    style={{ left: `${Math.min(target, 100)}%` }}
                    title={`目標: ${target.toFixed(1)}%`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
        色條 = 實際配置 · 黑線 = 目標配置
      </p>
    </div>
  );
}
