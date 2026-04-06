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
});
