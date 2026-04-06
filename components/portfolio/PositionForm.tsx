'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Position, MarketType, Transaction } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';
import { CRYPTO_META } from '@/lib/constants';

interface PositionFormProps {
  editing?: Position;
  onSave: (data: Omit<Position, 'id'>, firstLot?: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

const MARKET_OPTIONS: { value: MarketType; label: string }[] = [
  { value: 'crypto',  label: '加密貨幣' },
  { value: 'us',      label: '美股' },
  { value: 'taiwan',  label: '台股' },
  { value: 'cash',    label: '現金' },
  { value: 'manual',  label: '手動輸入' },
];

const CATEGORY_OPTIONS: { value: MarketType; label: string }[] = [
  { value: 'crypto',  label: '虛擬貨幣' },
  { value: 'us',      label: '美股' },
  { value: 'taiwan',  label: '台股' },
  { value: 'cash',    label: '現金' },
  { value: 'manual',  label: '其他' },
];


const MANUAL_PRESETS = ['零碎股', '外幣存款', '質押中', '其他'];
const CASH_PRESETS   = ['現金 USD', '現金 TWD', '活存', '定存', '外幣存款'];

export function PositionForm({ editing, onSave, onCancel }: PositionFormProps) {
  const { settings } = useSettings();

  // Dynamic suggestions from dashboard settings
  // crypto: CoinGecko IDs (e.g. 'bitcoin') → mapped to display symbols (e.g. 'BTC')
  const SUGGESTIONS: Partial<Record<MarketType, string[]>> = {
    crypto: settings.dashboardSymbols.crypto.map(
      (id) => CRYPTO_META[id]?.symbol ?? id.toUpperCase()
    ),
    us:     settings.dashboardSymbols.us,
    taiwan: settings.dashboardSymbols.taiwan,
  };

  // Compute lots-derived quantity for the position being edited (if any)
  const editingLotsQty = (editing?.lots?.length ?? 0) > 0
    ? editing!.lots!.reduce((s, l) => s + (l.type === 'buy' ? l.quantity : -l.quantity), 0)
    : null;

  const [market, setMarket]               = useState<MarketType>(editing?.market ?? 'crypto');
  const [symbol, setSymbol]               = useState(editing?.symbol ?? '');
  // legacy quantity field (used when no lots exist)
  const [quantity, setQuantity]           = useState(editing?.quantity?.toString() ?? '');
  // actual total field (used when lots exist — user inputs real account balance)
  const [actualQuantity, setActualQuantity] = useState<string>(() => {
    if (editingLotsQty === null) return '';
    return (editingLotsQty + (editing?.adjustedQuantity ?? 0)).toString();
  });
  const [manualValue, setManualValue]     = useState(editing?.manualValue?.toString() ?? '');
  const [manualCurrency, setManualCurrency] = useState<'USD' | 'TWD'>(editing?.manualCurrency ?? 'USD');
  const [category, setCategory]           = useState<MarketType>(editing?.category ?? 'manual');
  const [twExchange, setTwExchange]       = useState<'tse' | 'otc'>(editing?.twExchange ?? 'tse');
  // First lot fields (new positions only)
  const [firstLotDate, setFirstLotDate]       = useState('');
  const [firstLotQty, setFirstLotQty]         = useState('');
  const [firstLotPrice, setFirstLotPrice]     = useState('');
  const [firstLotCurrency, setFirstLotCurrency] = useState<'USD' | 'TWD'>(
    editing?.market === 'taiwan' ? 'TWD' : 'USD'
  );

  useEffect(() => {
    if (editing) {
      const lotsQty = (editing.lots?.length ?? 0) > 0
        ? editing.lots!.reduce((s, l) => s + (l.type === 'buy' ? l.quantity : -l.quantity), 0)
        : null;
      setMarket(editing.market);
      setSymbol(editing.symbol);
      setQuantity(editing.quantity?.toString() ?? '');
      setActualQuantity(lotsQty !== null
        ? (lotsQty + (editing.adjustedQuantity ?? 0)).toString()
        : '');
      setManualValue(editing.manualValue?.toString() ?? '');
      setManualCurrency(editing.manualCurrency ?? 'USD');
      setCategory(editing.category ?? 'manual');
      setTwExchange(editing.twExchange ?? 'tse');
    }
  }, [editing]);

  const isManualLike = market === 'manual' || market === 'cash';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isManualLike) {
      const mv = parseFloat(manualValue);
      if (!symbol.trim() || isNaN(mv) || mv < 0) return;
      const extra = market === 'manual' ? { category } : {};
      onSave({ symbol: symbol.trim(), market, quantity: 1,
               manualValue: mv, manualCurrency, ...extra });
    } else if (editing && editingLotsQty !== null) {
      // Editing a position that already has lots — derive adjustedQuantity from actual total
      if (!symbol.trim()) return;
      const actualQty = parseFloat(actualQuantity);
      const adjQty = isNaN(actualQty) ? 0 : actualQty - editingLotsQty;
      onSave({
        symbol: symbol.trim().toUpperCase(), market, quantity: editing.quantity,
        adjustedQuantity: adjQty === 0 ? undefined : adjQty,
        ...(market === 'taiwan' ? { twExchange } : {}),
        lots: editing.lots,
      }, undefined);
    } else if (!editing) {
      // New position — quantity starts at 0, driven by lots
      if (!symbol.trim()) return;
      // Build optional first lot if user filled in qty + price
      const lotQty   = parseFloat(firstLotQty);
      const lotPrice = parseFloat(firstLotPrice);
      const firstLot: Omit<Transaction, 'id'> | undefined =
        !isNaN(lotQty) && lotQty > 0 && !isNaN(lotPrice) && lotPrice > 0
          ? { type: 'buy', date: firstLotDate || undefined, quantity: lotQty, price: lotPrice, currency: firstLotCurrency }
          : undefined;
      onSave(
        { symbol: symbol.trim().toUpperCase(), market, quantity: 0, ...(market === 'taiwan' ? { twExchange } : {}) },
        firstLot
      );
    } else {
      // Editing a position without lots (backward compat) — keep legacy quantity field
      const qty = parseFloat(quantity);
      if (!symbol.trim() || isNaN(qty) || qty <= 0) return;
      onSave({ symbol: symbol.trim().toUpperCase(), market, quantity: qty,
               ...(market === 'taiwan' ? { twExchange } : {}) }, undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {editing ? '編輯倉位' : '新增倉位'}
          </h3>
          <button type="button" onClick={onCancel}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Market */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">類型</label>
          <div className="flex gap-2 flex-wrap">
            {MARKET_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => { setMarket(opt.value); setSymbol(''); }}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  market === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category override (manual only) */}
        {market === 'manual' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">歸類到</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setCategory(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    category === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Taiwan: 上市 / 上櫃 */}
        {market === 'taiwan' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">市場</label>
            <div className="flex gap-2">
              {(['tse', 'otc'] as const).map((ex) => (
                <button key={ex} type="button" onClick={() => setTwExchange(ex)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    twExchange === ex
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}>
                  {ex === 'tse' ? '上市 (TSE)' : '上櫃 (OTC)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name / Symbol */}
        <div className="space-y-1.5">
          <label htmlFor="position-symbol" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isManualLike ? '名稱' : '代號'}
          </label>
          <input id="position-symbol" type="text" value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={
              market === 'cash'   ? '現金 USD、定存…' :
              market === 'manual' ? '零碎股、外幣存款…' :
              (SUGGESTIONS[market]?.[0] ?? '')
            }
            className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required />
          {!isManualLike && SUGGESTIONS[market] && (
            <div className="flex gap-1.5 flex-wrap">
              {SUGGESTIONS[market]!.map((s) => (
                <button key={s} type="button" onClick={() => setSymbol(s)}
                  className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          {market === 'cash' && (
            <div className="flex gap-1.5 flex-wrap">
              {CASH_PRESETS.map((s) => (
                <button key={s} type="button" onClick={() => setSymbol(s)}
                  className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          {market === 'manual' && (
            <div className="flex gap-1.5 flex-wrap">
              {MANUAL_PRESETS.map((s) => (
                <button key={s} type="button" onClick={() => setSymbol(s)}
                  className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity (non-manual) */}
        {!isManualLike && editing && editingLotsQty !== null && (
          // Editing a position that has lots: show actual total input
          <div className="space-y-1.5">
            <label htmlFor="actual-quantity" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">目前實際數量</label>
            <input id="actual-quantity" type="number" value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
              placeholder="0.00" step="any"
              className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              交易紀錄推算：{editingLotsQty.toLocaleString()}
              {(() => {
                const actualQty = parseFloat(actualQuantity);
                const adj = isNaN(actualQty) ? 0 : actualQty - editingLotsQty;
                if (Math.abs(adj) < 0.000001) return null;
                return (
                  <span className={adj > 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {' '}（{adj > 0 ? '+' : ''}{adj.toLocaleString(undefined, { maximumFractionDigits: 8 })} 利息/調整）
                  </span>
                );
              })()}
            </p>
          </div>
        )}
        {!isManualLike && !editing && (
          // New position: embed first lot section
          <div className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pt-1">
              第一筆買入 <span className="font-normal normal-case text-zinc-400">（選填）</span>
            </p>
            <div className="space-y-1.5">
              <label htmlFor="first-lot-date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                日期 <span className="text-zinc-400 font-normal">（選填）</span>
              </label>
              <input id="first-lot-date" type="date" value={firstLotDate}
                onChange={(e) => setFirstLotDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="first-lot-qty" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">數量</label>
                <input id="first-lot-qty" type="number" value={firstLotQty}
                  onChange={(e) => setFirstLotQty(e.target.value)}
                  placeholder="0.00" step="any" min="0"
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="first-lot-price" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">買入單價</label>
                <div className="flex gap-1.5">
                  <input id="first-lot-price" type="number" value={firstLotPrice}
                    onChange={(e) => setFirstLotPrice(e.target.value)}
                    placeholder="0.00" step="any" min="0"
                    className="flex-1 min-w-0 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {(['USD', 'TWD'] as const).map((c) => (
                    <button key={c} type="button" onClick={() => setFirstLotCurrency(c)}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        firstLotCurrency === c
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {firstLotQty && firstLotPrice && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                合計：{firstLotCurrency}{' '}
                {(parseFloat(firstLotQty) * parseFloat(firstLotPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
            )}
          </div>
        )}
        {!isManualLike && editing && editingLotsQty === null && (
          // Editing without lots (backward compat) — keep legacy quantity field
          <div className="space-y-1.5">
            <label htmlFor="position-quantity" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">數量</label>
            <input id="position-quantity" type="number" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00" step="any" min="0"
              className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>
        )}

        {/* Manual/cash value + currency */}
        {isManualLike && (
          <div className="space-y-1.5">
            <label htmlFor="manual-value" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">現值</label>
            <div className="flex gap-2">
              <input id="manual-value" type="number" value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="0.00" step="any" min="0"
                className="flex-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
              {(['USD', 'TWD'] as const).map((c) => (
                <button key={c} type="button" onClick={() => setManualCurrency(c)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    manualCurrency === c
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            取消
          </button>
          <button type="submit"
            className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            {editing ? '更新' : '新增'}
          </button>
        </div>
      </form>
    </div>
  );
}
