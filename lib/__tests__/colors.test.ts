import { describe, it, expect } from 'vitest';
import { gainColor, gainBadgeClass } from '../colors';

describe('gainColor', () => {
  describe('western convention (default)', () => {
    it('positive → green', () => {
      expect(gainColor(true)).toBe('text-green-500');
      expect(gainColor(true, 'western')).toBe('text-green-500');
    });

    it('negative → red', () => {
      expect(gainColor(false)).toBe('text-red-500');
      expect(gainColor(false, 'western')).toBe('text-red-500');
    });
  });

  describe('taiwan convention', () => {
    it('positive → red', () => {
      expect(gainColor(true, 'taiwan')).toBe('text-red-500');
    });

    it('negative → green', () => {
      expect(gainColor(false, 'taiwan')).toBe('text-green-500');
    });
  });
});

describe('gainBadgeClass', () => {
  describe('western convention (default)', () => {
    it('positive → green badge', () => {
      const cls = gainBadgeClass(true);
      expect(cls).toContain('green');
      expect(cls).toContain('bg-green');
      expect(cls).toContain('text-green');
    });

    it('negative → red badge', () => {
      const cls = gainBadgeClass(false);
      expect(cls).toContain('red');
      expect(cls).toContain('bg-red');
      expect(cls).toContain('text-red');
    });
  });

  describe('taiwan convention', () => {
    it('positive → red badge', () => {
      const cls = gainBadgeClass(true, 'taiwan');
      expect(cls).toContain('bg-red');
      expect(cls).toContain('text-red');
    });

    it('negative → green badge', () => {
      const cls = gainBadgeClass(false, 'taiwan');
      expect(cls).toContain('bg-green');
      expect(cls).toContain('text-green');
    });
  });

  it('includes dark mode classes', () => {
    expect(gainBadgeClass(true)).toContain('dark:');
    expect(gainBadgeClass(false)).toContain('dark:');
  });
});
