'use client';

import { Fragment, useState } from 'react';
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategorySummary, MarketType, Transaction } from '@/lib/types';
import { formatPrice, fmtUSD, fmtTWD } from '@/lib/formatters';
import { CATEGORY_COLORS, AMOUNT_MASK } from '@/lib/constants';
import { gainColor } from '@/lib/colors';
import { useToggleSet } from '@/hooks/useToggleSet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
  onAddLot: (positionId: string) => void;
  onEditLot: (positionId: string, lot: Transaction) => void;
  onDeleteLot: (positionId: string, lotId: string) => void;
}

function txAmountUSD(tx: Transaction, usdToTwd: number): number {
  const raw = tx.price * tx.quantity;
  return tx.currency === 'TWD' ? raw / usdToTwd : raw;
}
function txAmountTWD(tx: Transaction, usdToTwd: number): number {
  const raw = tx.price * tx.quantity;
  return tx.currency === 'TWD' ? raw : raw * usdToTwd;
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
  onAddLot,
  onEditLot,
  onDeleteLot,
}: PositionTableProps) {
  const hasAnyItems = categorySummaries.some((c) => c.items.length > 0);

  const { set: collapsedCategories, toggle: toggleCategory, setSet: setCollapsedCategories } = useToggleSet();

  // Position delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; symbol: string } | null>(null);

  // Inline lot accordion state
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);

  // Lot delete confirmation state
  const [pendingDeleteLot, setPendingDeleteLot] = useState<{
    positionId: string;
    lotId: string;
    positionSymbol: string;
    lotLabel: string;
  } | null>(null);

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
                    onClick={() => { toggleCategory(cat.market); setExpandedPositionId(null); }}
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
                  {!isCollapsed && cat.items.map(({ position, name, price, currency, valuation, valuationTWD, percent, costBasis, unrealizedPL, unrealizedPLPercent, unrealizedPLTWD }) => {
                    const isExpandable = position.market !== 'cash';
                    const isExpanded = expandedPositionId === position.id;
                    const lots = [...(position.lots ?? [])].sort((a, b) =>
                      (b.date ?? '0000-00-00').localeCompare(a.date ?? '0000-00-00')
                    );
                    return (
                    <Fragment key={position.id}>
                    <tr
                      className={`border-b border-zinc-50 dark:border-zinc-800/50 transition-colors ${isExpandable ? 'cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                      onClick={isExpandable ? () => setExpandedPositionId(isExpanded ? null : position.id) : undefined}
                    >
                      <td className="px-5 py-3 pl-9">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            {isExpandable && (
                              isExpanded
                                ? <ChevronDown  className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {position.symbol}
                            </span>
                          </div>
                          {name && name !== position.symbol && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 ml-5">
                              {name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {position.market === 'manual'
                          ? <span className="text-zinc-400">—</span>
                          : (() => {
                              const lotsQty = (position.lots?.length ?? 0) > 0
                                ? position.lots!.reduce((s, l) => s + (l.type === 'buy' ? l.quantity : -l.quantity), 0)
                                : null;
                              const effectiveQty = lotsQty !== null
                                ? lotsQty + (position.adjustedQuantity ?? 0)
                                : position.quantity;
                              const adj = position.adjustedQuantity;
                              return (
                                <div className="leading-snug">
                                  <div>{effectiveQty.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
                                  {adj != null && Math.abs(adj) > 0.000001 && (
                                    <div className={`text-xs ${adj > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                      {adj > 0 ? '+' : ''}{adj.toLocaleString(undefined, { maximumFractionDigits: 8 })} 獎勵
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                        }
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
                            onClick={(e) => { e.stopPropagation(); onEdit(position.id); }}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="編輯"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: position.id, symbol: position.symbol }); }}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline lot sub-table */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-0 py-0 border-b border-zinc-200 dark:border-zinc-700">
                          <div className="bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-700">
                            {/* Sub-header bar */}
                            <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-200 dark:border-zinc-700">
                              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                交易紀錄
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onAddLot(position.id); }}
                                className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                新增交易
                              </button>
                            </div>

                            {lots.length === 0 ? (
                              <p className="text-xs text-zinc-400 dark:text-zinc-600 px-6 py-4">
                                尚無交易紀錄，點選新增開始記錄
                              </p>
                            ) : (
                              <div className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                                {lots.map((tx) => {
                                  const amtUSD = txAmountUSD(tx, usdToTwd);
                                  const amtTWD = txAmountTWD(tx, usdToTwd);
                                  const sign = tx.type === 'sell' ? '-' : '';
                                  const primaryAmt   = preferredCurrency === 'TWD' ? `${sign}${fmtTWD(amtTWD)}`  : `${sign}${fmtUSD(amtUSD)}`;
                                  const secondaryAmt = preferredCurrency === 'TWD' ? `${sign}${fmtUSD(amtUSD)}` : `${sign}${fmtTWD(amtTWD)}`;
                                  const isBuy = tx.type === 'buy';
                                  return (
                                    <div
                                      key={tx.id}
                                      className={`flex items-center gap-4 pl-0 pr-4 py-2.5 text-xs ${
                                        isBuy
                                          ? 'bg-green-50/60 dark:bg-green-950/20'
                                          : 'bg-red-50/60 dark:bg-red-950/20'
                                      }`}
                                    >
                                      {/* Left color bar */}
                                      <div className={`w-1 self-stretch flex-shrink-0 rounded-r ${isBuy ? 'bg-green-400 dark:bg-green-600' : 'bg-red-400 dark:bg-red-600'}`} />

                                      {/* Type badge */}
                                      <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${
                                        isBuy
                                          ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400'
                                          : 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400'
                                      }`}>
                                        {isBuy ? '買入' : '賣出'}
                                      </span>

                                      {/* Date */}
                                      <span className="flex-shrink-0 w-24 tabular-nums text-zinc-500 dark:text-zinc-400">
                                        {tx.date ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                                      </span>

                                      {/* Qty × Price */}
                                      <span className="flex-1 tabular-nums text-zinc-600 dark:text-zinc-300">
                                        {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                        <span className="text-zinc-400 dark:text-zinc-500 mx-1">×</span>
                                        {hideAmounts ? AMOUNT_MASK : tx.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                        <span className="text-zinc-400 dark:text-zinc-500 ml-1">{tx.currency}</span>
                                      </span>

                                      {/* Amount */}
                                      <div className={`flex-shrink-0 text-right tabular-nums leading-snug ${
                                        isBuy ? 'text-zinc-600 dark:text-zinc-300' : 'text-red-500 dark:text-red-400'
                                      }`}>
                                        {usdToTwd > 0 ? (
                                          <>
                                            <div className="font-medium">{hideAmounts ? AMOUNT_MASK : primaryAmt}</div>
                                            <div className="opacity-50">{hideAmounts ? AMOUNT_MASK : secondaryAmt}</div>
                                          </>
                                        ) : '—'}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex-shrink-0 flex items-center gap-0.5">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onEditLot(position.id, tx); }}
                                          className="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                          title="編輯交易"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPendingDeleteLot({
                                              positionId: position.id,
                                              lotId: tx.id,
                                              positionSymbol: position.symbol,
                                              lotLabel: tx.date
                                                ? `${isBuy ? '買入' : '賣出'} ${tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} 股／顆（${tx.date}）`
                                                : `${isBuy ? '買入' : '賣出'} ${tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} 股／顆`,
                                            });
                                          }}
                                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors"
                                          title="刪除交易"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                    );
                  })}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`刪除倉位「${pendingDelete.symbol}」`}
          description="此倉位的所有交易紀錄將一併刪除，且無法復原。確定要繼續嗎？"
          confirmLabel="確認刪除"
          onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingDeleteLot && (
        <ConfirmDialog
          title={`刪除「${pendingDeleteLot.positionSymbol}」的交易紀錄`}
          description={`即將刪除：${pendingDeleteLot.lotLabel}。此操作無法復原，確定要繼續嗎？`}
          confirmLabel="確認刪除"
          onConfirm={() => { onDeleteLot(pendingDeleteLot.positionId, pendingDeleteLot.lotId); setPendingDeleteLot(null); }}
          onCancel={() => setPendingDeleteLot(null)}
        />
      )}
    </div>
  );
}
