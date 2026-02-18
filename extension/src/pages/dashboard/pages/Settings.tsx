import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { updateSettings, setStore } from '../../../shared/storage/store';
import type { AppStorage } from '../../../shared/types';

export default function Settings() {
  const { store, refresh } = useStore();
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleExport = () => {
    const data = JSON.stringify(store, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `focusguard-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppStorage;
        if (!parsed.blockedItems || !Array.isArray(parsed.blockedItems)) {
          throw new Error('Invalid backup file');
        }
        await setStore(parsed);
        setImportSuccess('Settings imported successfully!');
        setImportError('');
        refresh();
        setTimeout(() => setImportSuccess(''), 3000);
      } catch {
        setImportError('Invalid file. Please use a FocusGuard backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (!confirm('Are you sure? This will delete ALL blocked sites, insights, and settings. This cannot be undone.')) return;
    await chrome.storage.local.clear();
    chrome.runtime.sendMessage({ type: 'REBUILD_RULES' });
    refresh();
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">General extension preferences.</p>

      <div className="space-y-4">
        {/* Theme */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
          </div>
          <button
            onClick={() => updateSettings({ theme: store.settings.theme === 'dark' ? 'light' : 'dark' })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${store.settings.theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${store.settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Desktop Notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Notify when limits are hit or focus sessions end</p>
          </div>
          <button
            onClick={() => updateSettings({ showNotifications: !store.settings.showNotifications })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${store.settings.showNotifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${store.settings.showNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Daily summary */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Daily Summary Notification</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Get a browsing summary notification at 9 PM each day</p>
          </div>
          <button
            onClick={() => updateSettings({ dailySummaryEnabled: !store.settings.dailySummaryEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${store.settings.dailySummaryEnabled !== false ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${store.settings.dailySummaryEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Break reminder */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">Break Reminder</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified after continuous browsing</p>
            </div>
            <button
              onClick={() => updateSettings({ breakReminderMinutes: store.settings.breakReminderMinutes === 0 ? 30 : 0 })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(store.settings.breakReminderMinutes ?? 30) > 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${(store.settings.breakReminderMinutes ?? 30) > 0 ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {(store.settings.breakReminderMinutes ?? 30) > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">Remind after</span>
              <select
                value={store.settings.breakReminderMinutes ?? 30}
                onChange={(e) => updateSettings({ breakReminderMinutes: Number(e.target.value) })}
                className="input py-1 w-28 text-sm"
              >
                {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Whitelist mode */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Whitelist Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Block all sites except those on your block list</p>
          </div>
          <button
            onClick={() => { updateSettings({ whitelistMode: !store.settings.whitelistMode }); chrome.runtime.sendMessage({ type: 'REBUILD_RULES' }); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${store.settings.whitelistMode ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${store.settings.whitelistMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Export */}
        <div className="card">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Export Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Download your entire configuration as a JSON backup file.
          </p>
          <button onClick={handleExport} className="btn-secondary">Export Backup</button>
        </div>

        {/* Import */}
        <div className="card">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Import Settings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Restore from a previously exported backup file.
          </p>
          <label className="btn-secondary cursor-pointer">
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {importError && <p className="text-sm text-red-500 mt-2">{importError}</p>}
          {importSuccess && <p className="text-sm text-green-600 mt-2">{importSuccess}</p>}
        </div>

        {/* Reset */}
        <div className="card border-red-200 dark:border-red-900">
          <h3 className="font-medium text-red-700 dark:text-red-400 mb-1">Reset All Data</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Permanently delete all settings, blocked sites, and browsing insights. Cannot be undone.
          </p>
          <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/30">
            Reset Everything
          </button>
        </div>

        {/* Version */}
        <div className="text-xs text-slate-400 text-center pt-2">
          SiteBlocker Pro v1.0.0 &mdash; All features free &amp; open source
        </div>
      </div>
    </div>
  );
}
