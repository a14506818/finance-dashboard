'use client';

import { Fragment } from 'react';
import { Trash2, Plus, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import type { Position, Transaction, CategoryConfig } from '@/lib/types';
import { AMOUNT_MASK, CATEGORY_COLORS } from '@/lib/constants';
import { fmtUSD, fmtTWD } from '@/lib/formatters';
import { useToggleSet } from '@/hooks/useToggleSet';

interface LotTableProps {
  positions: Position[];
  categories: CategoryConfig[];
  usdToTwd: number;
  preferredCurrency?: 'USD' | 'TWD';
  hideAmounts?: boolean;
  onAdd: (positionId?: string) => void;
  onEdit: (positionId: string, lot: Transaction) => void;
  onDelete: (positionId: string, lotId: string) => void;
}

function txAmountUSD(tx: Transaction, usdToTwd: number): number {
  const raw = tx.price * tx.quantity;
  return tx.currency === 'TWD' ? raw / usdToTwd : raw;
}
function txAmountTWD(tx: Transaction, usdToTwd: number): number {
  const raw = tx.price * tx.quantity;
  return tx.currency === 'TWD' ? raw : raw * usdToTwd;
}

export function LotTable({ positions, categories, usdToTwd, preferredCurrency = 'USD', hideAmounts = false, onAdd, onEdit, onDelete }: LotTableProps) {
  const eligible = positions.filter((p) => p.market !== 'cash');

  // Group positions by category bucket (same logic as usePortfolioValuation)
  const positionsByCategory: Record<string, Position[]> = {};
  for (const pos of eligible) {
    const key = pos.category ?? pos.market;
    if (!positionsByCategory[key]) positionsByCategory[key] = [];
    positionsByCategory[key].push(pos);
  }

  // Only show categories that have at least one position with lots
  const visibleCategories = categories.filter((cat) =>
    (positionsByCategory[cat.market] ?? []).some((p) => (p.lots?.length ?? 0) > 0)
  );

  const hasAnyLots = visibleCategories.length > 0;

  const { set: collapsedPositions, toggle: togglePosition, setSet: setCollapsedPositions } = useToggleSet();

  const showTWD = preferredCurrency === 'TWD';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          交易紀錄
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsedPositions(new Set(eligible.map((p) => p.id)))}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            全部收合
          </button>
          <button
            onClick={() => setCollapsedPositions(new Set())}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            全部展開
          </button>
          <button
            onClick={() => onAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增紀錄
          </button>
        </div>
      </div>

      {!hasAnyLots ? (
        <div className="px-5 py-12 text-center text-zinc-400 dark:text-zinc-600">
          <p className="text-sm">尚無交易紀錄，點選「新增紀錄」開始建立</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500">
                <th className="text-left px-5 py-3 font-medium">倉位</th>
                <th className="text-left px-4 py-3 font-medium">類型</th>
                <th className="text-left px-4 py-3 font-medium">日期</th>
                <th className="text-right px-4 py-3 font-medium">數量</th>
                <th className="text-right px-4 py-3 font-medium">單價</th>
                <th className="text-right px-4 py-3 font-medium">幣別</th>
                <th className="text-right px-4 py-3 font-medium">
                  金額 ({showTWD ? 'TWD' : 'USD'})
                </th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((cat) => {
                const catPositions = (positionsByCategory[cat.market] ?? [])
                  .filter((p) => (p.lots?.length ?? 0) > 0);

                return (
                  <Fragment key={cat.market}>
                    {/* Category header row */}
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
                      <td colSpan={8} className="px-5 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[cat.market] }}
                          />
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Position groups within this category */}
                    {catPositions.map((pos) => {
                      const lots = pos.lots ?? [];

                      const totalBuyUSD  = lots.filter((t) => t.type === 'buy').reduce((s, t) => s + txAmountUSD(t, usdToTwd), 0);
                      const totalSellUSD = lots.filter((t) => t.type === 'sell').reduce((s, t) => s + txAmountUSD(t, usdToTwd), 0);
                      const totalBuyTWD  = lots.filter((t) => t.type === 'buy').reduce((s, t) => s + txAmountTWD(t, usdToTwd), 0);
                      const totalSellTWD = lots.filter((t) => t.type === 'sell').reduce((s, t) => s + txAmountTWD(t, usdToTwd), 0);

                      const fmtBuy  = showTWD ? fmtTWD(totalBuyTWD)  : fmtUSD(totalBuyUSD);
                      const fmtSell = showTWD ? fmtTWD(totalSellTWD) : fmtUSD(totalSellUSD);

                      return (
                        <Fragment key={pos.id}>
                          {/* Position group header */}
                          <tr
                            className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer select-none"
                            onClick={() => togglePosition(pos.id)}
                          >
                            <td className="px-5 py-2" colSpan={6}>
                              <div className="flex items-center gap-2">
                                {collapsedPositions.has(pos.id)
                                  ? <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                  : <ChevronDown  className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                }
                                <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">
                                  {pos.symbol}
                                </span>
                                <span className="text-xs text-zinc-400">{lots.length} 筆</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-2 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                              {usdToTwd > 0 && (
                                <div>
                                  <span className="text-green-500">買 {hideAmounts ? AMOUNT_MASK : fmtBuy}</span>
                                  {(showTWD ? totalSellTWD : totalSellUSD) > 0 && (
                                    <span className="text-red-400 ml-2">賣 {hideAmounts ? AMOUNT_MASK : fmtSell}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onAdd(pos.id)}
                                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                              >
                                + 新增
                              </button>
                            </td>
                          </tr>

                          {/* Transaction rows */}
                          {!collapsedPositions.has(pos.id) && lots.map((tx) => {
                            const amtUSD = txAmountUSD(tx, usdToTwd);
                            const amtTWD = txAmountTWD(tx, usdToTwd);
                            const sign = tx.type === 'sell' ? '-' : '';
                            const primaryAmt   = showTWD ? `${sign}${fmtTWD(amtTWD)}`  : `${sign}${fmtUSD(amtUSD)}`;
                            const secondaryAmt = showTWD ? `${sign}${fmtUSD(amtUSD)}` : `${sign}${fmtTWD(amtTWD)}`;

                            return (
                              <tr
                                key={tx.id}
                                className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                              >
                                <td className="px-5 py-3 pl-9 text-zinc-300 dark:text-zinc-600 text-xs">└</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    tx.type === 'buy'
                                      ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                                  }`}>
                                    {tx.type === 'buy' ? '買入' : '賣出'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                                  {tx.date ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                                </td>
                                <td className="text-right px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                </td>
                                <td className="text-right px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {hideAmounts ? AMOUNT_MASK : tx.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </td>
                                <td className="text-right px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                  {tx.currency}
                                </td>
                                <td className={`text-right px-4 py-3 tabular-nums ${
                                  tx.type === 'buy'
                                    ? 'text-zinc-600 dark:text-zinc-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {usdToTwd > 0 ? (
                                    <div className="leading-snug">
                                      <div>{hideAmounts ? AMOUNT_MASK : primaryAmt}</div>
                                      <div className="text-xs opacity-60">{hideAmounts ? AMOUNT_MASK : secondaryAmt}</div>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td className="text-right px-5 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => onEdit(pos.id, tx)}
                                      className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                      title="編輯"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDelete(pos.id, tx.id)}
                                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors"
                                      title="刪除"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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
    </div>
  );
}
