import type { Position, CategoryConfig, MarketType, Transaction, AppSettings } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const STORAGE_KEY = 'finance_dashboard_portfolio';
const CATEGORIES_KEY = 'finance_dashboard_categories';
const SETTINGS_KEY = 'finance_dashboard_settings';

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

export function loadPositions(): Position[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePositions(positions: Position[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function addPosition(
  positions: Position[],
  data: Omit<Position, 'id'>
): Position[] {
  const newPos: Position = { ...data, id: generateId() };
  const updated = [...positions, newPos];
  savePositions(updated);
  return updated;
}

export function updatePosition(
  positions: Position[],
  id: string,
  updates: Partial<Omit<Position, 'id'>>
): Position[] {
  const updated = positions.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  savePositions(updated);
  return updated;
}

export function deletePosition(
  positions: Position[],
  id: string
): Position[] {
  const updated = positions.filter((p) => p.id !== id);
  savePositions(updated);
  return updated;
}

// Category CRUD
export function loadCategories(): CategoryConfig[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed: CategoryConfig[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    // Merge: keep saved targetPercent values, but ensure all default markets exist
    const savedMap = new Map(parsed.map((c) => [c.market, c]));
    return DEFAULT_CATEGORIES.map((def) => savedMap.get(def.market) ?? def);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function updateCategoryTarget(
  categories: CategoryConfig[],
  market: MarketType,
  targetPercent: number
): CategoryConfig[] {
  const updated = categories.map((c) =>
    c.market === market ? { ...c, targetPercent } : c
  );
  saveCategories(updated);
  return updated;
}

// Lot CRUD
export function addLot(
  positions: Position[],
  positionId: string,
  lotData: Omit<Transaction, 'id'>
): Position[] {
  const lot: Transaction = { ...lotData, id: generateId() };
  const updated = positions.map((p) =>
    p.id === positionId
      ? { ...p, lots: [...(p.lots ?? []), lot] }
      : p
  );
  savePositions(updated);
  return updated;
}

export function updateLot(
  positions: Position[],
  positionId: string,
  lotId: string,
  updates: Omit<Transaction, 'id'>
): Position[] {
  const updated = positions.map((p) =>
    p.id === positionId
      ? {
          ...p,
          lots: (p.lots ?? []).map((l) =>
            l.id === lotId ? { ...updates, id: lotId } : l
          ),
        }
      : p
  );
  savePositions(updated);
  return updated;
}

export function deleteLot(
  positions: Position[],
  positionId: string,
  lotId: string
): Position[] {
  const updated = positions.map((p) =>
    p.id === positionId
      ? { ...p, lots: (p.lots ?? []).filter((l) => l.id !== lotId) }
      : p
  );
  savePositions(updated);
  return updated;
}

// Export / Import
export function exportToJSON(
  positions: Position[],
  categories: CategoryConfig[],
  settings: AppSettings
): string {
  return JSON.stringify(
    { version: '1.1', exportDate: new Date().toISOString(), positions, categories, settings },
    null,
    2
  );
}

export function importFromJSON(
  jsonStr: string
): { positions: Position[]; categories: CategoryConfig[]; settings?: AppSettings } | null {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data.positions) || !Array.isArray(data.categories)) return null;
    // Basic validation: each position must have id, symbol, market, quantity
    const validPositions = data.positions.filter(
      (p: unknown) =>
        p &&
        typeof p === 'object' &&
        typeof (p as Position).id === 'string' &&
        typeof (p as Position).symbol === 'string' &&
        typeof (p as Position).market === 'string' &&
        typeof (p as Position).quantity === 'number'
    ) as Position[];
    const validCategories = data.categories.filter(
      (c: unknown) =>
        c && typeof c === 'object' && typeof (c as CategoryConfig).market === 'string'
    ) as CategoryConfig[];
    // settings is optional — v1.0 files don't have it
    const settings: AppSettings | undefined =
      data.settings && typeof data.settings === 'object' ? (data.settings as AppSettings) : undefined;
    return { positions: validPositions, categories: validCategories, settings };
  } catch {
    return null;
  }
}
