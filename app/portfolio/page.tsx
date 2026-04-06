'use client';

import { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioValuation } from '@/hooks/usePortfolioValuation';
import { useSettings } from '@/hooks/useSettings';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { AllocationBar } from '@/components/portfolio/AllocationBar';
import { PositionTable } from '@/components/portfolio/PositionTable';
import { PositionForm } from '@/components/portfolio/PositionForm';
import { LotTable } from '@/components/portfolio/LotTable';
import { LotForm } from '@/components/portfolio/LotForm';
import type { Position, Transaction } from '@/lib/types';

type Tab = 'positions' | 'lots';

export default function PortfolioPage() {
  const {
    positions, categories,
    add, update, remove, setCategoryTarget,
    addLot, updateLot, deleteLot,
  } = usePortfolio();

  const { categorySummaries, totalValuation, totalValuationTWD, usdToTwd, isLoading } =
    usePortfolioValuation(positions, categories);
  const { settings } = useSettings();

  const [tab, setTab]             = useState<Tab>('positions');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLotForm, setShowLotForm]             = useState(false);
  const [lotFormPositionId, setLotFormPositionId] = useState<string | undefined>();
  const [editingLot, setEditingLot]               = useState<{ positionId: string; lot: Transaction } | undefined>();

  const editingPosition = editingId ? positions.find((p) => p.id === editingId) : undefined;

  const handleSave = (data: Omit<Position, 'id'>, firstLot?: Omit<Transaction, 'id'>) => {
    if (editingId) {
      update(editingId, data);
      setEditingId(null);
    } else {
      add(data, firstLot);
      setShowForm(false);
    }
  };

  const handleSaveLot = (positionId: string, lot: Omit<Transaction, 'id'>) => {
    if (editingLot) {
      updateLot(editingLot.positionId, editingLot.lot.id, lot);
    } else {
      addLot(positionId, lot);
    }
    setShowLotForm(false);
    setLotFormPositionId(undefined);
    setEditingLot(undefined);
  };

  const handleOpenLotForm = (positionId?: string) => {
    setLotFormPositionId(positionId);
    setEditingLot(undefined);
    setShowLotForm(true);
  };

  const handleEditLot = (positionId: string, lot: Transaction) => {
    setEditingLot({ positionId, lot });
    setShowLotForm(true);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {([
          { key: 'positions', label: '倉位' },
          { key: 'lots',      label: '交易紀錄' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'positions' && (
        <>
          <PortfolioSummary
            categorySummaries={categorySummaries}
            totalValuation={totalValuation}
            totalValuationTWD={totalValuationTWD}
            isLoading={isLoading}
            preferredCurrency={settings.preferredCurrency}
            hideAmounts={settings.hideAmounts}
            redGreenConvention={settings.redGreenConvention}
          />

          <AllocationBar categorySummaries={categorySummaries} />

          <PositionTable
            categorySummaries={categorySummaries}
            isLoading={isLoading}
            usdToTwd={usdToTwd}
            preferredCurrency={settings.preferredCurrency}
            hideAmounts={settings.hideAmounts}
            redGreenConvention={settings.redGreenConvention}
            onAdd={() => setShowForm(true)}
            onEdit={(id) => setEditingId(id)}
            onDelete={remove}
            onUpdateCategoryTarget={setCategoryTarget}
            onAddLot={handleOpenLotForm}
            onEditLot={handleEditLot}
            onDeleteLot={deleteLot}
          />
        </>
      )}

      {tab === 'lots' && (
        <LotTable
          positions={positions}
          categories={categories}
          usdToTwd={usdToTwd}
          preferredCurrency={settings.preferredCurrency}
          hideAmounts={settings.hideAmounts}
          onAdd={handleOpenLotForm}
          onEdit={handleEditLot}
          onDelete={deleteLot}
        />
      )}

      <footer className="text-xs text-zinc-400 dark:text-zinc-600 pb-4">
        <p>估值匯率即時抓取 · 台股每 60 秒更新 · 僅供參考，不構成投資建議</p>
      </footer>

      {(showForm || editingId) && (
        <PositionForm
          editing={editingPosition}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {showLotForm && (
        <LotForm
          positions={positions}
          defaultPositionId={lotFormPositionId}
          editing={editingLot}
          onSave={handleSaveLot}
          onCancel={() => {
            setShowLotForm(false);
            setLotFormPositionId(undefined);
            setEditingLot(undefined);
          }}
        />
      )}
    </main>
  );
}
