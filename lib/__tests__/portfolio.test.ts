import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPositions, savePositions, addPosition, updatePosition, deletePosition,
  addLot, updateLot, deleteLot,
  loadCategories, updateCategoryTarget,
  importFromJSON, exportToJSON,
} from '../portfolio';
import { DEFAULT_SETTINGS } from '../settings';
import { DEFAULT_CATEGORIES } from '../constants';
import type { Position, Transaction } from '../types';

const STORAGE_KEY = 'finance_dashboard_portfolio';

const makePosition = (overrides: Partial<Position> = {}): Omit<Position, 'id'> => ({
  symbol: 'BTC',
  market: 'crypto',
  quantity: 1,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

// ─── Positions ────────────────────────────────────────────────────────────────

describe('loadPositions', () => {
  it('returns [] when localStorage is empty', () => {
    expect(loadPositions()).toEqual([]);
  });

  it('returns saved positions', () => {
    const positions: Position[] = [{ id: 'a1', symbol: 'ETH', market: 'crypto', quantity: 2 }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    expect(loadPositions()).toEqual(positions);
  });

  it('returns [] on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad}');
    expect(loadPositions()).toEqual([]);
  });

  it('returns [] when stored value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(loadPositions()).toEqual([]);
  });
});

describe('addPosition', () => {
  it('appends a new position with a generated id', () => {
    const result = addPosition([], makePosition());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBeTruthy();
    expect(result[0].symbol).toBe('BTC');
  });

  it('persists to localStorage', () => {
    addPosition([], makePosition());
    expect(loadPositions()).toHaveLength(1);
  });

  it('does not mutate the original array', () => {
    const original: Position[] = [];
    addPosition(original, makePosition());
    expect(original).toHaveLength(0);
  });
});

describe('updatePosition', () => {
  it('updates the matching position by id', () => {
    const [pos] = addPosition([], makePosition());
    const result = updatePosition(loadPositions(), pos.id, { quantity: 5 });
    expect(result[0].quantity).toBe(5);
    expect(result[0].symbol).toBe('BTC');
  });

  it('leaves other positions untouched', () => {
    const withEth = addPosition([], makePosition({ symbol: 'ETH' }));
    const withBoth = addPosition(withEth, makePosition({ symbol: 'BTC' }));
    const btc = withBoth.find((p) => p.symbol === 'BTC')!;
    const updated = updatePosition(withBoth, btc.id, { symbol: 'DOGE' });
    expect(updated.find((p) => p.symbol === 'ETH')).toBeTruthy();
    expect(updated.find((p) => p.symbol === 'DOGE')).toBeTruthy();
  });
});

describe('deletePosition', () => {
  it('removes the position with the given id', () => {
    const [pos] = addPosition([], makePosition());
    const result = deletePosition(loadPositions(), pos.id);
    expect(result).toHaveLength(0);
  });

  it('does not remove non-matching ids', () => {
    addPosition([], makePosition());
    const result = deletePosition(loadPositions(), 'nonexistent');
    expect(result).toHaveLength(1);
  });
});

// ─── Lots ─────────────────────────────────────────────────────────────────────

const makeLot = (overrides: Partial<Transaction> = {}): Omit<Transaction, 'id'> => ({
  type: 'buy',
  quantity: 1,
  price: 50000,
  currency: 'USD',
  date: '2024-01-01',
  ...overrides,
});

describe('addLot', () => {
  it('adds a lot to the correct position', () => {
    const positions = addPosition([], makePosition());
    const posId = positions[0].id;
    const result = addLot(positions, posId, makeLot());
    expect(result[0].lots).toHaveLength(1);
    expect(result[0].lots![0].type).toBe('buy');
  });

  it('generates unique id for the lot', () => {
    const positions = addPosition([], makePosition());
    const posId = positions[0].id;
    const result = addLot(positions, posId, makeLot());
    expect(result[0].lots![0].id).toBeTruthy();
  });
});

describe('updateLot', () => {
  it('updates the correct lot', () => {
    let positions = addPosition([], makePosition());
    const posId = positions[0].id;
    positions = addLot(positions, posId, makeLot());
    const lotId = positions[0].lots![0].id;
    const result = updateLot(positions, posId, lotId, { ...makeLot(), price: 60000 });
    expect(result[0].lots![0].price).toBe(60000);
  });
});

describe('deleteLot', () => {
  it('removes the correct lot', () => {
    let positions = addPosition([], makePosition());
    const posId = positions[0].id;
    positions = addLot(positions, posId, makeLot());
    const lotId = positions[0].lots![0].id;
    const result = deleteLot(positions, posId, lotId);
    expect(result[0].lots).toHaveLength(0);
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe('loadCategories', () => {
  it('returns DEFAULT_CATEGORIES when localStorage is empty', () => {
    expect(loadCategories()).toEqual(DEFAULT_CATEGORIES);
  });

  it('merges saved targetPercent values with defaults', () => {
    const saved = DEFAULT_CATEGORIES.map((c) =>
      c.market === 'crypto' ? { ...c, targetPercent: 50 } : c
    );
    localStorage.setItem('finance_dashboard_categories', JSON.stringify(saved));
    const result = loadCategories();
    expect(result.find((c) => c.market === 'crypto')?.targetPercent).toBe(50);
  });
});

describe('updateCategoryTarget', () => {
  it('updates targetPercent for the given market', () => {
    const result = updateCategoryTarget(DEFAULT_CATEGORIES, 'crypto', 40);
    expect(result.find((c) => c.market === 'crypto')?.targetPercent).toBe(40);
  });

  it('does not mutate other categories', () => {
    const result = updateCategoryTarget(DEFAULT_CATEGORIES, 'crypto', 40);
    const others = result.filter((c) => c.market !== 'crypto');
    const defaults = DEFAULT_CATEGORIES.filter((c) => c.market !== 'crypto');
    expect(others.map((c) => c.targetPercent)).toEqual(defaults.map((c) => c.targetPercent));
  });
});

// ─── Import / Export ──────────────────────────────────────────────────────────

describe('exportToJSON', () => {
  it('returns valid JSON with positions, categories, settings', () => {
    const positions: Position[] = [{ id: 'x', symbol: 'BTC', market: 'crypto', quantity: 1 }];
    const json = exportToJSON(positions, DEFAULT_CATEGORIES, DEFAULT_SETTINGS);
    const parsed = JSON.parse(json);
    expect(parsed.positions).toEqual(positions);
    expect(parsed.categories).toEqual(DEFAULT_CATEGORIES);
    expect(parsed.version).toBe('1.1');
  });
});

describe('importFromJSON', () => {
  it('parses a valid export JSON', () => {
    const positions: Position[] = [{ id: 'x', symbol: 'BTC', market: 'crypto', quantity: 1 }];
    const json = exportToJSON(positions, DEFAULT_CATEGORIES, DEFAULT_SETTINGS);
    const result = importFromJSON(json);
    expect(result).not.toBeNull();
    expect(result!.positions).toHaveLength(1);
    expect(result!.categories.length).toBeGreaterThan(0);
  });

  it('returns null on invalid JSON', () => {
    expect(importFromJSON('not json')).toBeNull();
  });

  it('returns null when positions is missing', () => {
    expect(importFromJSON(JSON.stringify({ categories: [] }))).toBeNull();
  });

  it('filters out invalid positions', () => {
    const json = JSON.stringify({
      positions: [
        { id: 'a', symbol: 'BTC', market: 'crypto', quantity: 1 },
        { id: 'b', symbol: 123, market: 'crypto', quantity: 1 }, // invalid symbol
      ],
      categories: DEFAULT_CATEGORIES,
    });
    const result = importFromJSON(json);
    expect(result!.positions).toHaveLength(1);
  });

  it('handles v1.0 files without settings field', () => {
    const json = JSON.stringify({
      positions: [{ id: 'a', symbol: 'ETH', market: 'crypto', quantity: 2 }],
      categories: DEFAULT_CATEGORIES,
    });
    const result = importFromJSON(json);
    expect(result).not.toBeNull();
    expect(result!.settings).toBeUndefined();
  });
});
