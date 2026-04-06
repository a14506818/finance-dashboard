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

// ─── New position: first lot section ─────────────────────────────────────────

describe('new position form', () => {
  it('shows first lot section with 日期, 數量, 買入單價 fields', () => {
    renderForm();
    expect(screen.getByText(/第一筆買入/)).toBeInTheDocument();
    expect(screen.getByLabelText(/日期/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^數量$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/買入單價/)).toBeInTheDocument();
  });

  it('does not show 目前實際數量 for new position', () => {
    renderForm();
    expect(screen.queryByLabelText('目前實際數量')).not.toBeInTheDocument();
  });

  it('shows first lot section for new us position', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '美股' }));
    expect(screen.getByText(/第一筆買入/)).toBeInTheDocument();
  });

  it('shows first lot section for new taiwan position', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '台股' }));
    expect(screen.getByText(/第一筆買入/)).toBeInTheDocument();
  });

  it('shows 現值 field for cash position (no first lot section)', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '現金' }));
    expect(screen.getByLabelText('現值')).toBeInTheDocument();
    expect(screen.queryByText(/第一筆買入/)).not.toBeInTheDocument();
  });

  it('shows total hint when qty and price are filled', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^數量$/), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/買入單價/), { target: { value: '0.5' } });
    expect(screen.getByText(/合計/)).toBeInTheDocument();
  });

  it('saves position with quantity 0 when first lot is not filled', () => {
    onSave.mockClear();
    renderForm();
    fireEvent.change(screen.getByLabelText(/代號/), { target: { value: 'ADA' } });
    fireEvent.click(screen.getByRole('button', { name: '新增' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'ADA', quantity: 0 }),
      undefined
    );
  });

  it('saves position with firstLot when qty and price are filled', () => {
    onSave.mockClear();
    renderForm();
    fireEvent.change(screen.getByLabelText(/代號/), { target: { value: 'ADA' } });
    fireEvent.change(screen.getByLabelText(/^數量$/), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/買入單價/), { target: { value: '0.5' } });
    fireEvent.click(screen.getByRole('button', { name: '新增' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'ADA', quantity: 0 }),
      expect.objectContaining({ type: 'buy', quantity: 1000, price: 0.5, currency: 'USD' })
    );
  });

  it('does not create first lot when only qty is filled (price missing)', () => {
    onSave.mockClear();
    renderForm();
    fireEvent.change(screen.getByLabelText(/代號/), { target: { value: 'ADA' } });
    fireEvent.change(screen.getByLabelText(/^數量$/), { target: { value: '1000' } });
    // price left empty
    fireEvent.click(screen.getByRole('button', { name: '新增' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 0 }),
      undefined
    );
  });

  it('includes date in firstLot when filled', () => {
    onSave.mockClear();
    renderForm();
    fireEvent.change(screen.getByLabelText(/代號/), { target: { value: 'ADA' } });
    fireEvent.change(screen.getByLabelText(/日期/), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/^數量$/), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/買入單價/), { target: { value: '0.6' } });
    fireEvent.click(screen.getByRole('button', { name: '新增' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ date: '2024-01-01', quantity: 500, price: 0.6 })
    );
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

  it('shows 目前實際數量 field (not first lot section)', () => {
    renderForm({ editing: editingWithLots });
    expect(screen.getByLabelText('目前實際數量')).toBeInTheDocument();
    expect(screen.queryByText(/第一筆買入/)).not.toBeInTheDocument();
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
      expect.objectContaining({ adjustedQuantity: 2 }),
      undefined  // no firstLot for editing
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
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ adjustedQuantity: undefined }),
      undefined
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
    expect(screen.queryByText(/第一筆買入/)).not.toBeInTheDocument();
  });

  it('prefills legacy quantity field', () => {
    renderForm({ editing: editingNoLots });
    const input = screen.getByLabelText(/^數量$/) as HTMLInputElement;
    expect(parseFloat(input.value)).toBe(0.5);
  });

  it('calls onSave with quantity and no firstLot', () => {
    onSave.mockClear();
    renderForm({ editing: editingNoLots });
    const input = screen.getByLabelText(/^數量$/);
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 2 }),
      undefined
    );
  });
});
