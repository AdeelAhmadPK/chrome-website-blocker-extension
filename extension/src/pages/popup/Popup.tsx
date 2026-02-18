import React, { useEffect, useState } from 'react';
import type { AppStorage, FocusModeConfig } from '../../shared/types';
import { getStore, DEFAULT_STORE } from '../../shared/storage/store';
import { normalizeDomain, generateId, formatCountdown } from '../../shared/utils';
import FaviconImage from '../dashboard/components/FaviconImage';
import { clsx } from 'clsx';

export default function Popup() {
  const [store, setStore] = useState<AppStorage>(DEFAULT_STORE);
  const [currentDomain, setCurrentDomain] = useState('');
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(0);

  useEffect(() => {
    getStore().then(setStore);
    // Get current tab domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? '';
      try {
        const h = new URL(url).hostname;
        setCurrentDomain(h.startsWith('www.') ? h.slice(4) : h);
      } catch {}
    });
    // Poll focus state from background
    chrome.runtime.sendMessage({ type: 'GET_FOCUS_STATE' }, (resp) => {
      if (resp?.state) {
        setStore((s) => ({ ...s, focusMode: resp.state }));
      }
    });
  }, []);

  // Live focus countdown
  useEffect(() => {
    const fn = store.focusMode;
    if (!fn.isActive || !fn.phaseEndsAt) { setFocusSecondsLeft(0); return; }
    const update = () => setFocusSecondsLeft(Math.max(0, Math.round((fn.phaseEndsAt! - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [store.focusMode.isActive, store.focusMode.phaseEndsAt]);

  const refresh = () => getStore().then(setStore);

  const handleToggleBlocking = async () => {
    const { updateSettings } = await import('../../shared/storage/store');
    await updateSettings({ blockingEnabled: !store.settings.blockingEnabled });
    chrome.runtime.sendMessage({ type: 'REBUILD_RULES' });
    refresh();
  };

  const handleBlockCurrent = async () => {
    if (!currentDomain) return;
    const already = store.blockedItems.find((b) => b.url === currentDomain);
    if (already) return;
    const { updateBlockedItems } = await import('../../shared/storage/store');
    await updateBlockedItems([
      ...store.blockedItems,
      { id: generateId(), url: currentDomain, type: 'domain', screenTimeToday: 0, createdAt: Date.now() },
    ]);
    refresh();
  };

  const handleStartFocus = () => {
    chrome.runtime.sendMessage({ type: 'START_FOCUS' }, () => refresh());
  };

  const handleStopFocus = () => {
    chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, () => refresh());
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    window.close();
  };

  const isCurrentBlocked = currentDomain && store.blockedItems.some((b) => b.url === currentDomain);
  const { focusMode } = store;

  return (
    <div className="font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-white" style={{ width: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 7v7c0 5 3.7 10 9 11.4C17.3 24 21 19 21 14V7l-9-5z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">SiteBlocker Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Blocking</span>
          <button
            onClick={handleToggleBlocking}
            className={clsx(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              store.settings.blockingEnabled ? 'bg-primary-500' : 'bg-gray-300'
            )}
          >
            <span className={clsx('inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform', store.settings.blockingEnabled ? 'translate-x-5' : 'translate-x-1')} />
          </button>
        </div>
      </div>

      {/* Current tab */}
      {currentDomain && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FaviconImage domain={currentDomain} size={18} />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{currentDomain}</span>
            </div>
            {isCurrentBlocked ? (
              <span className="badge bg-red-100 text-red-700 text-xs flex-shrink-0">Blocked</span>
            ) : (
              <button onClick={handleBlockCurrent} className="text-xs btn-primary py-1 px-2 flex-shrink-0">Block</button>
            )}
          </div>
        </div>
      )}

      {/* Focus Mode */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Focus Mode</span>
          {focusMode.isActive && (
            <span className={clsx('badge text-xs', focusMode.phase === 'work' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
              {focusMode.phase === 'work' ? 'Focus' : 'Break'}
            </span>
          )}
        </div>
        {focusMode.isActive ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xl font-bold text-gray-900 dark:text-white">{formatCountdown(focusSecondsLeft)}</div>
              <div className="text-xs text-gray-400">Session {focusMode.currentSession} of {focusMode.totalSessions}</div>
            </div>
            <button onClick={handleStopFocus} className="btn-secondary text-xs py-1">Stop</button>
          </div>
        ) : (
          <button onClick={handleStartFocus} className="btn-primary w-full text-xs py-2">
            Start Focus Session ({store.focusMode.workMinutes}m)
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{store.blockedItems.length} site{store.blockedItems.length !== 1 ? 's' : ''} blocked</span>
          <span>{store.insights.length} domains tracked</span>
        </div>
      </div>

      {/* Open dashboard */}
      <div className="px-4 py-3">
        <button onClick={openDashboard} className="btn-secondary w-full text-sm">
          Open Dashboard
        </button>
      </div>
    </div>
  );
}
