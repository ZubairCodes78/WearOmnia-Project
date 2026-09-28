'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { PublicStoreSettings } from '@/lib/settings';
import { DEFAULT_SITE_SETTINGS, DEFAULT_PREORDER_SETTINGS } from '@/lib/settings';

export const DEFAULT_STORE_SETTINGS: PublicStoreSettings = {
  ...DEFAULT_SITE_SETTINGS,
  preorder_enabled: DEFAULT_PREORDER_SETTINGS.preorder_enabled,
  preorder_advance_percent: DEFAULT_PREORDER_SETTINGS.preorder_advance_percent,
  preorder_payment_instructions: DEFAULT_PREORDER_SETTINGS.preorder_payment_instructions,
};

interface SettingsContextValue {
  settings: PublicStoreSettings;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_STORE_SETTINGS,
  refreshSettings: async () => {},
  isLoading: false,
});

export const SettingsProvider: React.FC<{
  initialSettings?: Partial<PublicStoreSettings>;
  children: React.ReactNode;
}> = ({ initialSettings, children }) => {
  const [settings, setSettings] = useState<PublicStoreSettings>({
    ...DEFAULT_STORE_SETTINGS,
    ...initialSettings,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/site-settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to refresh site settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // If not supplied via server props, or to verify current freshness:
    if (!initialSettings || Object.keys(initialSettings).length === 0) {
      refreshSettings();
    }

    // Listen for custom settings update events across tabs / components
    const handleSettingsUpdated = () => {
      refreshSettings();
    };

    window.addEventListener('wearomnia-settings-updated', handleSettingsUpdated);
    window.addEventListener('focus', handleSettingsUpdated);

    return () => {
      window.removeEventListener('wearomnia-settings-updated', handleSettingsUpdated);
      window.removeEventListener('focus', handleSettingsUpdated);
    };
  }, [initialSettings, refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
