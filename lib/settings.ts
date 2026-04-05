import type { AppSettings, UserProfile } from './types';

const SETTINGS_KEY = 'finance_dashboard_settings';

export const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  bio: '',
  investStartDate: '',
  avatarEmoji: '🐻',
  avatarColor: '#3b82f6',
};

export const DEFAULT_SETTINGS: AppSettings = {
  preferredCurrency: 'USD',
  hideAmounts: false,
  dashboardSymbols: {
    taiwan: ['0050', '0056'],
    us: ['VOO', 'QQQ'],
    crypto: ['bitcoin', 'ethereum', 'cardano'],
  },
  profile: DEFAULT_PROFILE,
};

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Deep merge with defaults to handle missing keys in older saves
    return {
      preferredCurrency: parsed.preferredCurrency ?? DEFAULT_SETTINGS.preferredCurrency,
      hideAmounts: parsed.hideAmounts ?? DEFAULT_SETTINGS.hideAmounts,
      dashboardSymbols: {
        taiwan: parsed.dashboardSymbols?.taiwan ?? DEFAULT_SETTINGS.dashboardSymbols.taiwan,
        us: parsed.dashboardSymbols?.us ?? DEFAULT_SETTINGS.dashboardSymbols.us,
        crypto: parsed.dashboardSymbols?.crypto ?? DEFAULT_SETTINGS.dashboardSymbols.crypto,
      },
      profile: {
        nickname:        parsed.profile?.nickname        ?? DEFAULT_PROFILE.nickname,
        bio:             parsed.profile?.bio             ?? DEFAULT_PROFILE.bio,
        investStartDate: parsed.profile?.investStartDate ?? DEFAULT_PROFILE.investStartDate,
        avatarEmoji:     parsed.profile?.avatarEmoji     ?? DEFAULT_PROFILE.avatarEmoji,
        avatarColor:     parsed.profile?.avatarColor     ?? DEFAULT_PROFILE.avatarColor,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const SETTINGS_CHANGE_EVENT = 'finance-settings-change';

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  // Notify same-tab listeners (localStorage 'storage' event only fires in other tabs)
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
}
