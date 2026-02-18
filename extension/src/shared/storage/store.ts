import type { AppStorage, BlockedItem, InsightEntry, FocusModeConfig, PasswordConfig, CustomBlockPageConfig, AppSettings } from '../types';

export const DEFAULT_STORE: AppStorage = {
  blockedItems: [],
  insights: [],
  focusMode: {
    workMinutes: 25,
    breakMinutes: 5,
    totalSessions: 4,
    currentSession: 1,
    isActive: false,
    phase: 'idle',
    whitelistedDomains: [],
  },
  password: {
    enabled: false,
    hash: '',
    failedAttempts: 0,
  },
  customBlockPage: {
    mode: 'default',
    message: "This site is blocked. Stay focused!",
    backgroundColor: '#FFFFFF',
    redirectDelay: 3,
  },
  settings: {
    blockingEnabled: true,
    whitelistMode: false,
    theme: 'light',
    showNotifications: true,
    dismissedSuggestions: [],
  },
  lastDailyReset: '',
};

export async function getStore(): Promise<AppStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      const merged: AppStorage = {
        ...DEFAULT_STORE,
        ...(result as Partial<AppStorage>),
        focusMode: { ...DEFAULT_STORE.focusMode, ...(result.focusMode ?? {}) },
        password: { ...DEFAULT_STORE.password, ...(result.password ?? {}) },
        customBlockPage: { ...DEFAULT_STORE.customBlockPage, ...(result.customBlockPage ?? {}) },
        settings: { ...DEFAULT_STORE.settings, ...(result.settings ?? {}) },
      };
      resolve(merged);
    });
  });
}

export async function setStore(partial: Partial<AppStorage>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, () => resolve());
  });
}

export async function updateBlockedItems(items: BlockedItem[]): Promise<void> {
  return setStore({ blockedItems: items });
}

export async function updateInsights(insights: InsightEntry[]): Promise<void> {
  return setStore({ insights });
}

export async function updateFocusMode(focusMode: Partial<FocusModeConfig>): Promise<void> {
  const store = await getStore();
  return setStore({ focusMode: { ...store.focusMode, ...focusMode } });
}

export async function updatePassword(password: Partial<PasswordConfig>): Promise<void> {
  const store = await getStore();
  return setStore({ password: { ...store.password, ...password } });
}

export async function updateCustomBlockPage(config: Partial<CustomBlockPageConfig>): Promise<void> {
  const store = await getStore();
  return setStore({ customBlockPage: { ...store.customBlockPage, ...config } });
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const store = await getStore();
  return setStore({ settings: { ...store.settings, ...settings } });
}

export function onStoreChange(callback: (changes: Partial<AppStorage>) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    const updated: Partial<AppStorage> = {};
    for (const [key, change] of Object.entries(changes)) {
      (updated as Record<string, unknown>)[key] = change.newValue;
    }
    callback(updated);
  };
  chrome.storage.local.onChanged.addListener(listener);
  return () => chrome.storage.local.onChanged.removeListener(listener);
}
