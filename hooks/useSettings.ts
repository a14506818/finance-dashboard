'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppSettings } from '@/lib/types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, SETTINGS_CHANGE_EVENT } from '@/lib/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  // Keep a ref so updateSettings always has the latest value without stale closures
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const initial = loadSettings();
    settingsRef.current = initial;
    setSettings(initial);

    // Sync when any other useSettings instance calls saveSettings()
    const onExternalChange = (e: Event) => {
      const next = (e as CustomEvent<AppSettings>).detail;
      settingsRef.current = next;
      setSettings(next);
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, onExternalChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, onExternalChange);
  }, []);

  // updateSettings must NOT call saveSettings() inside a setSettings updater,
  // because saveSettings() dispatches an event synchronously, which would trigger
  // setSettings() in other components during this component's render → React error.
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...updates };
    settingsRef.current = next;
    setSettings(next);        // update local state
    saveSettings(next);       // persist + dispatch event to other instances (outside render)
  }, []);

  return { settings, updateSettings };
}
