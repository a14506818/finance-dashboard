'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Position, MarketType } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';
import { CRYPTO_META } from '@/lib/constants';

interface PositionFormProps {
  editing?: Position;
  onSave: (data: Omit<Position, 'id'>) => void;
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

  const [market, setMarket]               = useState<MarketType>(editing?.market ?? 'crypto');
  const [symbol, setSymbol]               = useState(editing?.symbol ?? '');
  const [quantity, setQuantity]           = useState(editing?.quantity?.toString() ?? '');
  const [manualValue, setManualValue]     = useState(editing?.manualValue?.toString() ?? '');
  const [manualCurrency, setManualCurrency] = useState<'USD' | 'TWD'>(editing?.manualCurrency ?? 'USD');
  const [category, setCategory]           = useState<MarketType>(editing?.category ?? 'manual');
  const [twExchange, setTwExchange]       = useState<'tse' | 'otc'>(editing?.twExchange ?? 'tse');

  useEffect(() => {
    if (editing) {
      setMarket(editing.market);
      setSymbol(editing.symbol);
      setQuantity(editing.quantity?.toString() ?? '');
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
    } else {
      const qty = parseFloat(quantity);
      if (!symbol.trim() || isNaN(qty) || qty <= 0) return;
      onSave({ symbol: symbol.trim().toUpperCase(), market, quantity: qty,
               ...(market === 'taiwan' ? { twExchange } : {}) });
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
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isManualLike ? '名稱' : '代號'}
          </label>
          <input type="text" value={symbol}
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
        {!isManualLike && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">數量</label>
            <input type="number" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00" step="any" min="0"
              className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>
        )}

        {/* Manual/cash value + currency */}
        {isManualLike && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">現值</label>
            <div className="flex gap-2">
              <input type="number" value={manualValue}
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
