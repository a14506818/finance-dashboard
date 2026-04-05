'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Position, Transaction } from '@/lib/types';

interface LotFormProps {
  positions: Position[];
  defaultPositionId?: string;
  editing?: { positionId: string; lot: Transaction };
  onSave: (positionId: string, lot: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

export function LotForm({ positions, defaultPositionId, editing, onSave, onCancel }: LotFormProps) {
  const eligible = positions.filter((p) => p.market !== 'cash');

  const initPositionId = editing?.positionId ?? defaultPositionId ?? eligible[0]?.id ?? '';
  const initLot        = editing?.lot;

  const [positionId, setPositionId] = useState(initPositionId);
  const [txType, setTxType]         = useState<'buy' | 'sell'>(initLot?.type ?? 'buy');
  const [date, setDate]             = useState(initLot?.date ?? '');
  const [quantity, setQuantity]     = useState(initLot?.quantity.toString() ?? '');
  const [priceMode, setPriceMode]   = useState<'unit' | 'total'>('unit');
  const [unitPrice, setUnitPrice]   = useState(initLot?.price.toString() ?? '');
  const [totalAmt, setTotalAmt]     = useState('');
  const [currency, setCurrency]     = useState<'USD' | 'TWD'>(() => {
    if (initLot?.currency) return initLot.currency;
    const pos = eligible.find((p) => p.id === initPositionId);
    return pos?.market === 'taiwan' ? 'TWD' : 'USD';
  });

  const handlePositionChange = (id: string) => {
    setPositionId(id);
    const pos = eligible.find((p) => p.id === id);
    setCurrency(pos?.market === 'taiwan' ? 'TWD' : 'USD');
  };

  const qty   = parseFloat(quantity) || 0;
  const unit  = parseFloat(unitPrice) || 0;
  const total = parseFloat(totalAmt) || 0;

  const derivedTotal = priceMode === 'unit' && qty > 0 && unit > 0 ? qty * unit : null;
  const derivedUnit  = priceMode === 'total' && qty > 0 && total > 0 ? total / qty : null;

  const switchMode = (mode: 'unit' | 'total') => {
    if (mode === 'total' && derivedTotal != null) {
      setTotalAmt(derivedTotal.toFixed(4));
    } else if (mode === 'unit' && derivedUnit != null) {
      setUnitPrice(derivedUnit.toFixed(4));
    }
    setPriceMode(mode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionId || qty <= 0) return;

    let finalUnitPrice: number;
    if (priceMode === 'unit') {
      if (unit <= 0) return;
      finalUnitPrice = unit;
    } else {
      if (total <= 0 || qty <= 0) return;
      finalUnitPrice = total / qty;
    }

    onSave(positionId, {
      type: txType,
      date: date || undefined,
      quantity: qty,
      price: finalUnitPrice,
      currency,
    });
  };

  const fmtNum = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  if (eligible.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <p className="text-zinc-500 text-sm text-center py-4">請先新增倉位（非現金類型）</p>
          <div className="flex justify-end">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">關閉</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {editing ? '編輯交易紀錄' : '新增交易紀錄'}
          </h3>
          <button type="button" onClick={onCancel}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buy / Sell toggle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">類型</label>
          <div className="flex gap-2">
            {(['buy', 'sell'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTxType(t)}
                className={`flex-1 py-2 text-sm rounded-md border font-medium transition-colors ${
                  txType === t
                    ? t === 'buy'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                      : 'border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}>
                {t === 'buy' ? '買入' : '賣出'}
              </button>
            ))}
          </div>
        </div>

        {/* Position selector — locked when editing */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">倉位</label>
          {editing ? (
            <div className="px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-sm">
              {eligible.find((p) => p.id === positionId)?.symbol ?? positionId}
            </div>
          ) : (
            <select value={positionId} onChange={(e) => handlePositionChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {eligible.map((p) => (
                <option key={p.id} value={p.id}>{p.symbol}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            日期 <span className="text-zinc-400 font-normal">（選填）</span>
          </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">數量</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00" step="any" min="0" required
            className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Price — unit or total with switcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {txType === 'buy' ? '買入' : '賣出'}{priceMode === 'unit' ? '單價' : '總額'}
            </label>
            <div className="flex text-xs rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
              {(['unit', 'total'] as const).map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={`px-2.5 py-1 transition-colors ${
                    priceMode === m
                      ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-medium'
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}>
                  {m === 'unit' ? '單價' : '總價'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {priceMode === 'unit' ? (
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00" step="any" min="0" required
                className="flex-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            ) : (
              <input type="number" value={totalAmt} onChange={(e) => setTotalAmt(e.target.value)}
                placeholder="0.00" step="any" min="0" required
                className="flex-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
            {(['USD', 'TWD'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  currency === c
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                }`}>
                {c}
              </button>
            ))}
          </div>

          {priceMode === 'unit' && derivedTotal != null && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              合計：{currency} {fmtNum(derivedTotal)}
            </p>
          )}
          {priceMode === 'total' && derivedUnit != null && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              單價：{currency} {fmtNum(derivedUnit)} / 單位
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            取消
          </button>
          <button type="submit"
            className={`px-4 py-2 text-sm rounded-md text-white font-medium transition-colors ${
              txType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}>
            {editing
              ? (txType === 'buy' ? '更新買入' : '更新賣出')
              : (txType === 'buy' ? '新增買入' : '新增賣出')}
          </button>
        </div>
      </form>
    </div>
  );
}
