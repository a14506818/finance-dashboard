'use client';

import { Fragment, useState } from 'react';
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategorySummary, MarketType } from '@/lib/types';
import { formatPrice, fmtUSD, fmtTWD } from '@/lib/formatters';
import { CATEGORY_COLORS, AMOUNT_MASK } from '@/lib/constants';
import { gainColor } from '@/lib/colors';
import { useToggleSet } from '@/hooks/useToggleSet';

interface PositionTableProps {
  categorySummaries: CategorySummary[];
  isLoading: boolean;
  usdToTwd: number;
  preferredCurrency?: 'USD' | 'TWD';
  hideAmounts?: boolean;
  redGreenConvention?: 'western' | 'taiwan';
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateCategoryTarget: (market: MarketType, target: number) => void;
}

// Renders two-line dual-currency amount, swapping primary/secondary based on preferredCurrency
function DualCurrencyCell({
  usd, twd, preferredCurrency, hideAmounts, primaryCls = 'text-zinc-700 dark:text-zinc-300',
}: { usd: number; twd: number; preferredCurrency: 'USD' | 'TWD'; hideAmounts?: boolean; primaryCls?: string }) {
  const [primary, secondary] = preferredCurrency === 'TWD'
    ? [fmtTWD(twd), fmtUSD(usd)]
    : [fmtUSD(usd), fmtTWD(twd)];
  return (
    <div className={`leading-snug ${primaryCls}`}>
      <div>{hideAmounts ? AMOUNT_MASK : primary}</div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500">{hideAmounts ? AMOUNT_MASK : secondary}</div>
    </div>
  );
}

// Renders two-line P&L, swapping primary/secondary based on preferredCurrency
function PLCell({
  usd, twd, percent, preferredCurrency, hideAmounts, convention = 'western',
}: { usd: number; twd: number; percent?: number; preferredCurrency: 'USD' | 'TWD'; hideAmounts?: boolean; convention?: 'western' | 'taiwan' }) {
  const sign = (v: number) => v >= 0 ? '+' : '';
  const colorClass = gainColor(usd >= 0, convention);
  const pctStr = percent != null ? ` (${sign(percent)}${percent.toFixed(1)}%)` : '';

  if (hideAmounts) {
    return (
      <div className={`leading-snug ${colorClass}`}>
        <div>{AMOUNT_MASK}</div>
        <div className="text-xs opacity-80">{AMOUNT_MASK}<span className="opacity-70">{pctStr}</span></div>
      </div>
    );
  }

  if (preferredCurrency === 'TWD') {
    return (
      <div className={`leading-snug ${colorClass}`}>
        <div>{sign(twd)}{fmtTWD(twd)}</div>
        <div className="text-xs opacity-80">{sign(usd)}{fmtUSD(usd)}<span className="opacity-70">{pctStr}</span></div>
      </div>
    );
  }
  return (
    <div className={`leading-snug ${colorClass}`}>
      <div>{sign(usd)}{fmtUSD(usd)}</div>
      <div className="text-xs opacity-80">{sign(twd)}{fmtTWD(twd)}<span className="opacity-70">{pctStr}</span></div>
    </div>
  );
}

function CategoryTargetInput({
  market,
  targetPercent,
  onUpdate,
}: {
  market: MarketType;
  targetPercent: number;
  onUpdate: (market: MarketType, target: number) => void;
}) {
  const [value, setValue] = useState(targetPercent.toFixed(1));

  const commit = () => {
    const parsed = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setValue(parsed.toFixed(1));
    onUpdate(market, parsed);
  };

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      step="any"
      min="0"
      max="100"
      className="w-16 text-right px-1.5 py-0.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

export function PositionTable({
  categorySummaries,
  isLoading,
  usdToTwd,
  preferredCurrency = 'USD',
  hideAmounts = false,
  redGreenConvention = 'western',
  onAdd,
  onEdit,
  onDelete,
  onUpdateCategoryTarget,
}: PositionTableProps) {
  const hasAnyItems = categorySummaries.some((c) => c.items.length > 0);

  const { set: collapsedCategories, toggle: toggleCategory, setSet: setCollapsedCategories } = useToggleSet();

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            倉位明細
          </h2>
          {usdToTwd > 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
              {hideAmounts ? `匯率 1 USD = ${AMOUNT_MASK} TWD` : `匯率 1 USD = ${usdToTwd.toFixed(2)} TWD`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsedCategories(new Set(categorySummaries.map((c) => c.market)))}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            全部收合
          </button>
          <button
            onClick={() => setCollapsedCategories(new Set())}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            全部展開
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>
      </div>

      {!hasAnyItems && !isLoading ? (
        <div className="px-5 py-12 text-center text-zinc-400 dark:text-zinc-600">
          <p className="text-sm">尚無倉位，點選「新增」開始建立</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500">
                <th className="text-left px-5 py-3 font-medium">資產</th>
                <th className="text-right px-4 py-3 font-medium">數量</th>
                <th className="text-right px-4 py-3 font-medium">現價</th>
                <th className="text-right px-4 py-3 font-medium">估值</th>
                <th className="text-right px-4 py-3 font-medium">佔比</th>
                <th className="text-right px-4 py-3 font-medium table-cell">成本</th>
                <th className="text-right px-4 py-3 font-medium table-cell">損益</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {categorySummaries.map((cat) => {
                const isCollapsed = collapsedCategories.has(cat.market);
                return (
                <Fragment key={cat.market}>
                  {/* Category header row */}
                  <tr
                    key={`cat-${cat.market}`}
                    className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer select-none"
                    onClick={() => toggleCategory(cat.market)}
                  >
                    <td className="px-5 py-2.5" colSpan={3} >
                      <div className="flex items-center gap-2">
                        {isCollapsed
                          ? <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          : <ChevronDown  className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        }
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.market] }}
                        />
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">
                          {cat.name}
                        </span>
                        {cat.items.length === 0 && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-600">（空）</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-4 py-2.5 tabular-nums text-sm">
                      {cat.categoryValuation > 0
                        ? <DualCurrencyCell usd={cat.categoryValuation} twd={cat.categoryValuationTWD} preferredCurrency={preferredCurrency} hideAmounts={hideAmounts} primaryCls="font-medium text-zinc-900 dark:text-zinc-100" />
                        : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="text-right px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 text-xs">
                        <span className="tabular-nums text-zinc-600 dark:text-zinc-300 font-medium">
                          {cat.categoryPercent.toFixed(1)}%
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-600">目標</span>
                        <CategoryTargetInput
                          key={`${cat.market}-${cat.targetPercent}`}
                          market={cat.market}
                          targetPercent={cat.targetPercent}
                          onUpdate={onUpdateCategoryTarget}
                        />
                        <span className="text-zinc-400">%</span>
                        {cat.targetPercent > 0 && (
                          <span
                            className={`tabular-nums ${
                              Math.abs(cat.diff) < 1
                                ? 'text-zinc-400'
                                : cat.diff > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            ({cat.diff >= 0 ? '+' : ''}{cat.diff.toFixed(1)})
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Category cost */}
                    <td className="text-right px-4 py-2.5 tabular-nums table-cell text-sm">
                      {cat.categoryCostBasis != null
                        ? <DualCurrencyCell usd={cat.categoryCostBasis} twd={cat.categoryCostBasis * usdToTwd} preferredCurrency={preferredCurrency} hideAmounts={hideAmounts} primaryCls="text-zinc-500 dark:text-zinc-400" />
                        : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    {/* Category P&L */}
                    <td className="text-right px-4 py-2.5 tabular-nums table-cell text-sm">
                      {cat.categoryUnrealizedPL != null && cat.categoryUnrealizedPLTWD != null
                        ? <PLCell
                            usd={cat.categoryUnrealizedPL}
                            twd={cat.categoryUnrealizedPLTWD}
                            percent={cat.categoryCostBasis ? cat.categoryUnrealizedPL / cat.categoryCostBasis * 100 : undefined}
                            preferredCurrency={preferredCurrency}
                            hideAmounts={hideAmounts}
                            convention={redGreenConvention}
                          />
                        : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="px-5 py-2.5" />
                  </tr>

                  {/* Position rows */}
                  {!isCollapsed && cat.items.map(({ position, name, price, currency, valuation, valuationTWD, percent, costBasis, unrealizedPL, unrealizedPLPercent, unrealizedPLTWD }) => (
                    <tr
                      key={position.id}
                      className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 pl-9">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {position.symbol}
                            </span>
                          </div>
                          {name && name !== position.symbol && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                              {name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {position.market === 'manual'
                          ? <span className="text-zinc-400">—</span>
                          : position.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {position.market === 'manual'
                          ? <span className="text-zinc-400">—</span>
                          : formatPrice(price, currency)}
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums">
                        <DualCurrencyCell usd={valuation} twd={valuationTWD} preferredCurrency={preferredCurrency} hideAmounts={hideAmounts} primaryCls="font-medium text-zinc-900 dark:text-zinc-100" />
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums text-zinc-500 dark:text-zinc-500">
                        {percent.toFixed(1)}%
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums table-cell">
                        {costBasis != null
                          ? <DualCurrencyCell usd={costBasis} twd={costBasis * usdToTwd} preferredCurrency={preferredCurrency} hideAmounts={hideAmounts} primaryCls="text-zinc-500 dark:text-zinc-400" />
                          : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums table-cell">
                        {unrealizedPL != null && unrealizedPLPercent != null && unrealizedPLTWD != null
                          ? <PLCell usd={unrealizedPL} twd={unrealizedPLTWD} percent={unrealizedPLPercent} preferredCurrency={preferredCurrency} hideAmounts={hideAmounts} convention={redGreenConvention} />
                          : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                      </td>
                      <td className="text-right px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(position.id)}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="編輯"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(position.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
