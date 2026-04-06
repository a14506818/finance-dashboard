import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LotTable } from '../LotTable';
import type { Position, CategoryConfig } from '@/lib/types';

const categories: CategoryConfig[] = [
  { market: 'us', name: '美股', targetPercent: 0 },
  { market: 'crypto', name: '加密貨幣', targetPercent: 0 },
];

const makePosition = (overrides: Partial<Position> = {}): Position => ({
  id: 'p1',
  symbol: 'AAPL',
  market: 'us',
  quantity: 10,
  lots: [
    { id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' },
  ],
  ...overrides,
});

const defaultProps = {
  positions: [],
  categories,
  usdToTwd: 32,
  preferredCurrency: 'USD' as const,
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('LotTable', () => {
  it('shows empty state when no lots exist', () => {
    render(<LotTable {...defaultProps} />);
    expect(screen.getByText(/尚無交易紀錄/)).toBeInTheDocument();
  });

  it('renders 新增紀錄 button', () => {
    render(<LotTable {...defaultProps} />);
    expect(screen.getByRole('button', { name: /新增紀錄/ })).toBeInTheDocument();
  });

  it('renders position symbol and lot count', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText(/1 筆/)).toBeInTheDocument();
  });

  it('renders transaction rows with type badge', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);
    expect(screen.getByText('買入')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('collapses/expands transaction rows when position header clicked', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);

    // Transaction initially visible
    expect(screen.getByText('買入')).toBeInTheDocument();

    // Click position group header (symbol row)
    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.queryByText('買入')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();
  });

  it('全部收合 hides all transaction rows', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);

    expect(screen.getByText('買入')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '全部收合' }));
    expect(screen.queryByText('買入')).not.toBeInTheDocument();
  });

  it('全部展開 shows all transaction rows', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);

    fireEvent.click(screen.getByRole('button', { name: '全部收合' }));
    expect(screen.queryByText('買入')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '全部展開' }));
    expect(screen.getByText('買入')).toBeInTheDocument();
  });

  it('clicking + 新增 does NOT collapse the position', () => {
    const onAdd = vi.fn();
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} onAdd={onAdd} />);

    // + 新增 button in the position header
    const addBtn = screen.getByText('+ 新增');
    fireEvent.click(addBtn);

    // Transaction row should still be visible
    expect(screen.getByText('買入')).toBeInTheDocument();
    expect(onAdd).toHaveBeenCalledWith('p1');
  });

  it('calls onEdit when pencil button clicked', () => {
    const onEdit = vi.fn();
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} onEdit={onEdit} />);

    fireEvent.click(screen.getByTitle('編輯'));
    expect(onEdit).toHaveBeenCalledWith('p1', expect.objectContaining({ id: 'l1' }));
  });

  it('calls onDelete when trash button clicked', () => {
    const onDelete = vi.fn();
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('刪除'));
    expect(onDelete).toHaveBeenCalledWith('p1', 'l1');
  });

  it('shows category header row', () => {
    const positions = [makePosition()];
    render(<LotTable {...defaultProps} positions={positions} />);
    expect(screen.getByText('美股')).toBeInTheDocument();
  });

  it('shows sell transaction with 賣出 badge', () => {
    const positions = [makePosition({
      lots: [{ id: 'l1', type: 'sell', quantity: 5, price: 200, currency: 'USD', date: '2024-03-01' }],
    })];
    render(<LotTable {...defaultProps} positions={positions} />);
    expect(screen.getByText('賣出')).toBeInTheDocument();
  });

  it('shows buy/sell totals when usdToTwd > 0', () => {
    const positions = [makePosition({
      lots: [
        { id: 'l1', type: 'buy',  quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' },
        { id: 'l2', type: 'sell', quantity: 2,  price: 200, currency: 'USD', date: '2024-02-01' },
      ],
    })];
    render(<LotTable {...defaultProps} positions={positions} />);
    // "買 $1,500.00" summary in the position header
    expect(screen.getByText(/買 \$1,500\.00/)).toBeInTheDocument();
    expect(screen.getByText(/賣 \$400\.00/)).toBeInTheDocument();
  });
});
