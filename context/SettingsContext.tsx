'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { PublicStoreSettings } from '@/lib/settings';
import { DEFAULT_SITE_SETTINGS, DEFAULT_PREORDER_SETTINGS } from '@/lib/settings';

export const DEFAULT_STORE_SETTINGS: PublicStoreSettings = {
  ...DEFAULT_SITE_SETTINGS,
  preorder_enabled: DEFAULT_PREORDER_SETTINGS.preorder_enabled,
  preorder_advance_percent: DEFAULT_PREORDER_SETTINGS.preorder_advance_percent,
  preorder_advance_enabled: DEFAULT_PREORDER_SETTINGS.preorder_advance_enabled ?? true,
  preorder_payment_instructions: DEFAULT_PREORDER_SETTINGS.preorder_payment_instructions,
  is_preorder_campaign_active: true,
  preorder_campaign_phase: 'ACTIVE',
  has_active_payment_methods: true,
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
    // Refresh on mount to guarantee 100% synchronization against any stale CDN/prerendered cache
    refreshSettings();

    // Listen for custom settings update events across tabs / components
    const handleSettingsUpdated = () => {
      refreshSettings();
    };

    window.addEventListener('wearomnia-settings-updated', handleSettingsUpdated);
    window.addEventListener('focus', handleSettingsUpdated);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('wearomnia_settings_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SETTINGS_UPDATED') {
          refreshSettings();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('wearomnia-settings-updated', handleSettingsUpdated);
      window.removeEventListener('focus', handleSettingsUpdated);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, [initialSettings, refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
