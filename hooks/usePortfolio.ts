'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Position, CategoryConfig, MarketType, Transaction, AppSettings } from '@/lib/types';
import {
  loadPositions,
  addPosition,
  updatePosition,
  deletePosition,
  loadCategories,
  updateCategoryTarget,
  addLot,
  updateLot,
  deleteLot,
  savePositions,
  saveCategories,
} from '@/lib/portfolio';
import { saveSettings } from '@/lib/settings';

export function usePortfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setPositions(loadPositions());
    setCategories(loadCategories());
  }, []);

  const add = useCallback(
    (data: Omit<Position, 'id'>, firstLot?: Omit<Transaction, 'id'>) => {
      setPositions((prev) => {
        const withPosition = addPosition(prev, data);
        if (!firstLot) return withPosition;
        const newPos = withPosition[withPosition.length - 1];
        return addLot(withPosition, newPos.id, firstLot);
      });
    },
    []
  );

  const update = useCallback(
    (id: string, updates: Partial<Omit<Position, 'id'>>) => {
      setPositions((prev) => updatePosition(prev, id, updates));
    },
    []
  );

  const remove = useCallback(
    (id: string) => {
      setPositions((prev) => deletePosition(prev, id));
    },
    []
  );

  const setCategoryTarget = useCallback(
    (market: MarketType, targetPercent: number) => {
      setCategories((prev) => updateCategoryTarget(prev, market, targetPercent));
    },
    []
  );

  const addLotCb = useCallback(
    (positionId: string, lotData: Omit<Transaction, 'id'>) => {
      setPositions((prev) => addLot(prev, positionId, lotData));
    },
    []
  );

  const updateLotCb = useCallback(
    (positionId: string, lotId: string, updates: Omit<Transaction, 'id'>) => {
      setPositions((prev) => updateLot(prev, positionId, lotId, updates));
    },
    []
  );

  const deleteLotCb = useCallback(
    (positionId: string, lotId: string) => {
      setPositions((prev) => deleteLot(prev, positionId, lotId));
    },
    []
  );

  const importData = useCallback(
    (newPositions: Position[], newCategories: CategoryConfig[], newSettings?: AppSettings) => {
      savePositions(newPositions);
      saveCategories(newCategories);
      if (newSettings) saveSettings(newSettings);
      setPositions(newPositions);
      setCategories(loadCategories());
    },
    []
  );

  return {
    positions, categories,
    add, update, remove, setCategoryTarget,
    addLot: addLotCb, updateLot: updateLotCb, deleteLot: deleteLotCb,
    importData,
  };
}
