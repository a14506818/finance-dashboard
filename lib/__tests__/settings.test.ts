import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, DEFAULT_PROFILE, SETTINGS_CHANGE_EVENT } from '../settings';

const STORAGE_KEY = 'finance_dashboard_settings';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('loadSettings', () => {
  it('returns DEFAULT_SETTINGS when localStorage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns saved settings when they exist', () => {
    const custom = { ...DEFAULT_SETTINGS, preferredCurrency: 'TWD' as const };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    expect(loadSettings().preferredCurrency).toBe('TWD');
  });

  it('deep merges missing keys from defaults (backwards compat)', () => {
    // Simulate an old save that lacks redGreenConvention
    const oldFormat = { preferredCurrency: 'USD', hideAmounts: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldFormat));
    const result = loadSettings();
    expect(result.redGreenConvention).toBe(DEFAULT_SETTINGS.redGreenConvention);
    expect(result.dashboardSymbols).toEqual(DEFAULT_SETTINGS.dashboardSymbols);
    expect(result.profile).toEqual(DEFAULT_PROFILE);
  });

  it('deep merges partial dashboardSymbols', () => {
    const partial = { ...DEFAULT_SETTINGS, dashboardSymbols: { taiwan: ['2330'], us: undefined, crypto: undefined } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
    const result = loadSettings();
    expect(result.dashboardSymbols.taiwan).toEqual(['2330']);
    expect(result.dashboardSymbols.us).toEqual(DEFAULT_SETTINGS.dashboardSymbols.us);
    expect(result.dashboardSymbols.crypto).toEqual(DEFAULT_SETTINGS.dashboardSymbols.crypto);
  });

  it('returns defaults on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  it('persists settings to localStorage', () => {
    const custom = { ...DEFAULT_SETTINGS, preferredCurrency: 'TWD' as const };
    saveSettings(custom);
    expect(loadSettings().preferredCurrency).toBe('TWD');
  });

  it('dispatches a CustomEvent with the saved settings', () => {
    const handler = vi.fn();
    window.addEventListener(SETTINGS_CHANGE_EVENT, handler);
    saveSettings(DEFAULT_SETTINGS);
    expect(handler).toHaveBeenCalledOnce();
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual(DEFAULT_SETTINGS);
    window.removeEventListener(SETTINGS_CHANGE_EVENT, handler);
  });

  it('round-trips: save then load returns same value', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      preferredCurrency: 'TWD' as const,
      hideAmounts: true,
      redGreenConvention: 'taiwan' as const,
    };
    saveSettings(custom);
    expect(loadSettings()).toEqual(custom);
  });
});
