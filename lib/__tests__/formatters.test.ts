import { describe, it, expect } from 'vitest';
import { formatPrice, formatChange, formatPercent } from '../formatters';

describe('formatPrice', () => {
  describe('USD', () => {
    it('formats normal price with 2 decimals', () => {
      expect(formatPrice(1234.5, 'USD')).toBe('$1,234.50');
    });

    it('formats price < $100 with 4 decimals', () => {
      expect(formatPrice(12.3456, 'USD')).toBe('$12.3456');
    });

    it('formats price < $1 with 6 decimals (crypto)', () => {
      expect(formatPrice(0.000123, 'USD')).toBe('$0.000123');
    });

    it('defaults to USD when currency omitted', () => {
      expect(formatPrice(100)).toBe('$100.00');
    });

    it('formats zero (treated as < $1, uses 6 decimals)', () => {
      expect(formatPrice(0, 'USD')).toBe('$0.000000');
    });
  });

  describe('TWD', () => {
    it('always prefixes with NT$', () => {
      expect(formatPrice(32500, 'TWD')).toBe('NT$32,500.00');
    });

    it('formats small TWD with 2 decimals', () => {
      expect(formatPrice(10.5, 'TWD')).toBe('NT$10.50');
    });

    it('formats zero TWD', () => {
      expect(formatPrice(0, 'TWD')).toBe('NT$0.00');
    });
  });
});

describe('formatChange', () => {
  describe('USD', () => {
    it('prefixes positive change with +', () => {
      expect(formatChange(12.5, 'USD')).toBe('+12.50');
    });

    it('negative change keeps - sign', () => {
      expect(formatChange(-8.3, 'USD')).toBe('-8.30');
    });

    it('small change uses 4 decimals', () => {
      expect(formatChange(0.0012, 'USD')).toBe('+0.0012');
    });

    it('zero change prefixes with + (treated as < 1, uses 4 decimals)', () => {
      expect(formatChange(0, 'USD')).toBe('+0.0000');
    });

    it('defaults to USD when currency omitted', () => {
      expect(formatChange(5)).toBe('+5.00');
    });
  });

  describe('TWD', () => {
    it('formats positive TWD change with NT$ prefix', () => {
      expect(formatChange(12.5, 'TWD')).toBe('+NT$12.50');
    });

    it('formats negative TWD change with NT$ prefix', () => {
      expect(formatChange(-8.3, 'TWD')).toBe('-NT$8.30');
    });

    it('formats zero TWD change', () => {
      expect(formatChange(0, 'TWD')).toBe('+NT$0.00');
    });
  });
});

describe('formatPercent', () => {
  it('prefixes positive with +', () => {
    expect(formatPercent(5.23)).toBe('+5.23%');
  });

  it('negative keeps - sign', () => {
    expect(formatPercent(-2.1)).toBe('-2.10%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatPercent(3.14159)).toBe('+3.14%');
  });
});
