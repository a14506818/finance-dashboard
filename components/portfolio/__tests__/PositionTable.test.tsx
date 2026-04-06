import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionTable } from '../PositionTable';
import type { CategorySummary } from '@/lib/types';

const USD_TWD = 32;

function makeSummary(overrides: Partial<CategorySummary> = {}): CategorySummary {
  return {
    market: 'us',
    name: '美股',
    targetPercent: 0,
    items: [],
    categoryValuation: 0,
    categoryValuationTWD: 0,
    categoryPercent: 0,
    diff: 0,
    ...overrides,
  };
}

const defaultProps = {
  categorySummaries: [],
  isLoading: false,
  usdToTwd: USD_TWD,
  preferredCurrency: 'USD' as const,
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onUpdateCategoryTarget: vi.fn(),
  onAddLot: vi.fn(),
  onEditLot: vi.fn(),
  onDeleteLot: vi.fn(),
};

describe('PositionTable', () => {
  it('shows empty state when no items', () => {
    render(<PositionTable {...defaultProps} />);
    expect(screen.getByText(/尚無倉位/)).toBeInTheDocument();
  });

  it('renders 新增 button', () => {
    render(<PositionTable {...defaultProps} />);
    expect(screen.getByRole('button', { name: /新增/ })).toBeInTheDocument();
  });

  it('calls onAdd when 新增 button clicked', () => {
    const onAdd = vi.fn();
    render(<PositionTable {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /新增/ }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders category header with name', () => {
    const dummyItem = { position: { id: 'p1', symbol: 'AAPL', market: 'us' as const, quantity: 1 },
      name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 };
    const summaries = [makeSummary({ name: '美股', market: 'us', items: [dummyItem] })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);
    expect(screen.getByText('美股')).toBeInTheDocument();
  });

  it('renders position rows under category', () => {
    const summaries = [makeSummary({
      market: 'us',
      categoryValuation: 2000,
      categoryValuationTWD: 64000,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10 },
        name: 'Apple Inc.',
        price: 200,
        currency: 'USD',
        valuation: 2000,
        valuationTWD: 64000,
        percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('collapses/expands position rows when category header clicked', () => {
    const summaries = [makeSummary({
      market: 'us',
      categoryValuation: 2000,
      categoryValuationTWD: 64000,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10 },
        name: 'Apple Inc.',
        price: 200,
        currency: 'USD',
        valuation: 2000,
        valuationTWD: 64000,
        percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    // Initially visible
    expect(screen.getByText('AAPL')).toBeInTheDocument();

    // Click category header to collapse
    fireEvent.click(screen.getByText('美股'));
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(screen.getByText('美股'));
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('全部收合 hides all position rows', () => {
    const summaries = [
      makeSummary({ market: 'us', name: '美股', categoryValuation: 1, categoryValuationTWD: 32,
        items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
          name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }] }),
    ];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '全部收合' }));
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });

  it('全部展開 shows all position rows', () => {
    const summaries = [
      makeSummary({ market: 'us', name: '美股', categoryValuation: 1, categoryValuationTWD: 32,
        items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
          name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }] }),
    ];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    fireEvent.click(screen.getByRole('button', { name: '全部收合' }));
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '全部展開' }));
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('calls onEdit when pencil button clicked', () => {
    const onEdit = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
        name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onEdit={onEdit} />);
    fireEvent.click(screen.getByTitle('編輯'));
    expect(onEdit).toHaveBeenCalledWith('p1');
  });

  it('shows confirm dialog when trash button clicked', () => {
    const onDelete = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
        name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('刪除'));
    // Confirm dialog should appear
    expect(screen.getByText(/刪除倉位「AAPL」/)).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled(); // not yet
  });

  it('calls onDelete after confirm dialog confirmed', () => {
    const onDelete = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
        name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('刪除'));
    fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('does not call onDelete when confirm dialog cancelled', () => {
    const onDelete = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{ position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 1 },
        name: 'AAPL', price: 1, currency: 'USD', valuation: 1, valuationTWD: 32, percent: 100 }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('刪除'));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/刪除倉位/)).not.toBeInTheDocument();
  });

  it('shows exchange rate when usdToTwd > 0', () => {
    render(<PositionTable {...defaultProps} usdToTwd={32} categorySummaries={[makeSummary()]} />);
    expect(screen.getByText(/匯率/)).toBeInTheDocument();
  });

  it('shows category P&L percentage when cost data exists', () => {
    const dummyItem = { position: { id: 'p1', symbol: 'AAPL', market: 'us' as const, quantity: 10 },
      name: 'AAPL', price: 200, currency: 'USD', valuation: 2000, valuationTWD: 64000, percent: 100,
      costBasis: 1500, unrealizedPL: 500, unrealizedPLPercent: 33.3, unrealizedPLTWD: 16000 };
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 2000, categoryValuationTWD: 64000,
      categoryCostBasis: 1500,
      categoryUnrealizedPL: 500,
      categoryUnrealizedPLTWD: 16000,
      items: [dummyItem],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);
    // PLCell renders category percentage as "(+33.3%)"
    expect(screen.getAllByText(/33\.3%/).length).toBeGreaterThan(0);
  });

  // ── Inline lot accordion ──────────────────────────────────────────────────

  it('clicking position row expands lot sub-table', () => {
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: {
          id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
          lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
        },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    // Sub-table not visible yet
    expect(screen.queryByText('買入')).not.toBeInTheDocument();

    // Click position row
    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('clicking same position row again collapses sub-table', () => {
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: {
          id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
          lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
        },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();

    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.queryByText('買入')).not.toBeInTheDocument();
  });

  it('clicking category header collapses lot sub-table', () => {
    const summaries = [makeSummary({
      market: 'us', name: '美股', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: {
          id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
          lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
        },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();

    // Click category header — collapses both the category and the expanded lot sub-table
    fireEvent.click(screen.getByText('美股'));
    expect(screen.queryByText('買入')).not.toBeInTheDocument();
  });

  it('pencil button does not toggle expand, calls onEdit', () => {
    const onEdit = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: {
          id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
          lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
        },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onEdit={onEdit} />);

    // Expand first
    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();

    // Click edit button — should not collapse sub-table
    fireEvent.click(screen.getByTitle('編輯'));
    expect(onEdit).toHaveBeenCalledWith('p1');
    expect(screen.getByText('買入')).toBeInTheDocument();
  });

  it('trash button does not toggle expand, shows position confirm dialog', () => {
    const onDelete = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: {
          id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10,
          lots: [{ id: 'l1', type: 'buy', quantity: 10, price: 150, currency: 'USD', date: '2024-01-01' }],
        },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDelete={onDelete} />);

    // Expand first
    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText('買入')).toBeInTheDocument();

    // Click position delete — sub-table stays open, dialog appears
    fireEvent.click(screen.getByTitle('刪除'));
    expect(screen.getByText(/刪除倉位「AAPL」/)).toBeInTheDocument();
    expect(screen.getByText('買入')).toBeInTheDocument();
  });

  it('+ 新增交易 button calls onAddLot', () => {
    const onAddLot = vi.fn();
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10, lots: [] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onAddLot={onAddLot} />);

    fireEvent.click(screen.getByText('AAPL'));
    fireEvent.click(screen.getByText('新增交易'));
    expect(onAddLot).toHaveBeenCalledWith('p1');
  });

  it('empty lots state shown when position has no lots', () => {
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 0, lots: [] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 0, valuationTWD: 0, percent: 0,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} />);

    fireEvent.click(screen.getByText('AAPL'));
    expect(screen.getByText(/尚無交易紀錄/)).toBeInTheDocument();
  });

  it('sub-table pencil calls onEditLot', () => {
    const onEditLot = vi.fn();
    const lot = { id: 'l1', type: 'buy' as const, quantity: 10, price: 150, currency: 'USD' as const, date: '2024-01-01' };
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10, lots: [lot] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onEditLot={onEditLot} />);

    fireEvent.click(screen.getByText('AAPL'));
    fireEvent.click(screen.getByTitle('編輯交易'));
    expect(onEditLot).toHaveBeenCalledWith('p1', expect.objectContaining({ id: 'l1' }));
  });

  it('sub-table trash shows lot confirm dialog', () => {
    const onDeleteLot = vi.fn();
    const lot = { id: 'l1', type: 'buy' as const, quantity: 10, price: 150, currency: 'USD' as const, date: '2024-01-01' };
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10, lots: [lot] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDeleteLot={onDeleteLot} />);

    fireEvent.click(screen.getByText('AAPL'));
    fireEvent.click(screen.getByTitle('刪除交易'));
    expect(screen.getByText(/刪除「AAPL」的交易紀錄/)).toBeInTheDocument();
    expect(onDeleteLot).not.toHaveBeenCalled();
  });

  it('lot confirm dialog confirmed calls onDeleteLot', () => {
    const onDeleteLot = vi.fn();
    const lot = { id: 'l1', type: 'buy' as const, quantity: 10, price: 150, currency: 'USD' as const, date: '2024-01-01' };
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10, lots: [lot] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDeleteLot={onDeleteLot} />);

    fireEvent.click(screen.getByText('AAPL'));
    fireEvent.click(screen.getByTitle('刪除交易'));
    fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));
    expect(onDeleteLot).toHaveBeenCalledWith('p1', 'l1');
  });

  it('lot confirm dialog cancelled does not call onDeleteLot', () => {
    const onDeleteLot = vi.fn();
    const lot = { id: 'l1', type: 'buy' as const, quantity: 10, price: 150, currency: 'USD' as const, date: '2024-01-01' };
    const summaries = [makeSummary({
      market: 'us', categoryValuation: 1, categoryValuationTWD: 32,
      items: [{
        position: { id: 'p1', symbol: 'AAPL', market: 'us', quantity: 10, lots: [lot] },
        name: 'AAPL', price: 150, currency: 'USD', valuation: 1500, valuationTWD: 48000, percent: 100,
      }],
    })];
    render(<PositionTable {...defaultProps} categorySummaries={summaries} onDeleteLot={onDeleteLot} />);

    fireEvent.click(screen.getByText('AAPL'));
    fireEvent.click(screen.getByTitle('刪除交易'));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onDeleteLot).not.toHaveBeenCalled();
    expect(screen.queryByText(/刪除「AAPL」的交易紀錄/)).not.toBeInTheDocument();
  });
});
