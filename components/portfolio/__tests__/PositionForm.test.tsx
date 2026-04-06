import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionForm } from '../PositionForm';
import type { Position } from '@/lib/types';

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      dashboardSymbols: { crypto: ['bitcoin'], us: ['AAPL'], taiwan: ['0050'] },
      preferredCurrency: 'USD',
    },
  }),
}));

vi.mock('@/lib/constants', () => ({
  CRYPTO_META: {
    bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  },
}));

const onSave   = vi.fn();
const onCancel = vi.fn();

function renderForm(props?: { editing?: Position }) {
  return render(
    <PositionForm
      editing={props?.editing}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

// ─── New position: quantity field with hint ───────────────────────────────────

describe('new position form', () => {
  it('shows quantity field for new crypto position (with transaction hint)', () => {
    renderForm();
    expect(screen.getByLabelText(/^數量$/)).toBeInTheDocument();
  });

  it('shows hint about transaction-derived quantity for new positions', () => {
    renderForm();
    expect(screen.getByText(/新增交易紀錄後.*自動推算/)).toBeInTheDocument();
  });

  it('does not show 目前實際數量 for new position', () => {
    renderForm();
    expect(screen.queryByLabelText('目前實際數量')).not.toBeInTheDocument();
  });

  it('shows quantity field for new us position', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '美股' }));
    expect(screen.getByLabelText(/^數量$/)).toBeInTheDocument();
  });

  it('shows quantity field for new taiwan position', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '台股' }));
    expect(screen.getByLabelText(/^數量$/)).toBeInTheDocument();
  });

  it('shows 現值 field for cash position (no quantity field)', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '現金' }));
    expect(screen.getByLabelText('現值')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^數量$/)).not.toBeInTheDocument();
  });
});

// ─── Edit position with lots ──────────────────────────────────────────────────

describe('editing position with lots', () => {
  const editingWithLots: Position = {
    id: 'p1', symbol: 'ADA', market: 'crypto', quantity: 0,
    adjustedQuantity: 5,
    lots: [
      { id: 'l1', type: 'buy',  quantity: 1000, price: 0.5, currency: 'USD' },
      { id: 'l2', type: 'sell', quantity: 300,  price: 0.7, currency: 'USD' },
    ],
  };

  it('shows 目前實際數量 field (not legacy 數量)', () => {
    renderForm({ editing: editingWithLots });
    expect(screen.getByLabelText('目前實際數量')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^數量$/)).not.toBeInTheDocument();
  });

  it('prefills actual quantity with lotsQty + adjustedQuantity', () => {
    // lotsQty = 1000 - 300 = 700, adjustedQuantity = 5 → total = 705
    renderForm({ editing: editingWithLots });
    const input = screen.getByLabelText('目前實際數量') as HTMLInputElement;
    expect(parseFloat(input.value)).toBe(705);
  });

  it('shows lots-derived quantity in hint text', () => {
    renderForm({ editing: editingWithLots });
    expect(screen.getByText(/交易紀錄推算：700/)).toBeInTheDocument();
  });

  it('shows adjustment amount when actual differs from lots qty', () => {
    renderForm({ editing: editingWithLots });
    // 705 - 700 = +5 adjustment shown
    expect(screen.getByText(/\+5.*利息\/調整/)).toBeInTheDocument();
  });

  it('calls onSave with correct adjustedQuantity', () => {
    onSave.mockClear();
    renderForm({ editing: editingWithLots });
    const input = screen.getByLabelText('目前實際數量');
    fireEvent.change(input, { target: { value: '702' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    // adjustedQuantity = 702 - 700 = 2
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ adjustedQuantity: 2 })
    );
  });

  it('omits adjustedQuantity when actual equals lots qty exactly', () => {
    onSave.mockClear();
    const editingNoAdj: Position = {
      id: 'p1', symbol: 'ADA', market: 'crypto', quantity: 0,
      lots: [{ id: 'l1', type: 'buy', quantity: 1000, price: 0.5, currency: 'USD' }],
    };
    renderForm({ editing: editingNoAdj });
    const input = screen.getByLabelText('目前實際數量');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    // adjustedQuantity = 0 → should be omitted (undefined)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ adjustedQuantity: undefined })
    );
  });
});

// ─── Edit position without lots (backward compat) ────────────────────────────

describe('editing position without lots (backward compat)', () => {
  const editingNoLots: Position = {
    id: 'p1', symbol: 'BTC', market: 'crypto', quantity: 0.5,
  };

  it('shows legacy 數量 field when no lots', () => {
    renderForm({ editing: editingNoLots });
    expect(screen.getByLabelText(/^數量$/)).toBeInTheDocument();
    expect(screen.queryByLabelText('目前實際數量')).not.toBeInTheDocument();
  });

  it('prefills legacy quantity field', () => {
    renderForm({ editing: editingNoLots });
    const input = screen.getByLabelText(/^數量$/) as HTMLInputElement;
    expect(parseFloat(input.value)).toBe(0.5);
  });

  it('calls onSave with quantity (no adjustedQuantity)', () => {
    onSave.mockClear();
    renderForm({ editing: editingNoLots });
    const input = screen.getByLabelText(/^數量$/);
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 2 })
    );
    expect(onSave).not.toHaveBeenCalledWith(
      expect.objectContaining({ adjustedQuantity: expect.anything() })
    );
  });
});
