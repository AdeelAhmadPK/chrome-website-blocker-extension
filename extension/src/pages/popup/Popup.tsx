import React, { useEffect, useState } from 'react';
import type { AppStorage } from '../../shared/types';
import { getStore, DEFAULT_STORE } from '../../shared/storage/store';
import { normalizeDomain, generateId, formatCountdown } from '../../shared/utils';
import FaviconImage from '../dashboard/components/FaviconImage';
import { clsx } from 'clsx';

function formatMins(m: number) {
  if (m < 1) return '<1m';
  if (m < 60) return `${Math.round(m)}m`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
}

export default function Popup() {
  const [store, setStore] = useState<AppStorage>(DEFAULT_STORE);
  const [currentDomain, setCurrentDomain] = useState('');
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(0);
  const [view, setView] = useState<'home' | 'sites'>('home');

  useEffect(() => {
    getStore().then(setStore);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? '';
      try {
        const h = new URL(url).hostname;
        setCurrentDomain(h.startsWith('www.') ? h.slice(4) : h);
      } catch {}
    });
    chrome.runtime.sendMessage({ type: 'GET_FOCUS_STATE' }, (resp) => {
      if (resp?.state) setStore((s) => ({ ...s, focusMode: resp.state }));
    });
  }, []);

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

  const handleAddUsageLimit = async () => {
    if (!currentDomain) return;
    const { updateBlockedItems } = await import('../../shared/storage/store');
    const existing = store.blockedItems.find((b) => b.url === currentDomain);
    if (existing) {
      const updated = store.blockedItems.map((b) =>
        b.url === currentDomain ? { ...b, dailyLimitMinutes: b.dailyLimitMinutes ?? 60, limitOnly: true } : b
      );
      await updateBlockedItems(updated);
    } else {
      await updateBlockedItems([
        ...store.blockedItems,
        { id: generateId(), url: currentDomain, type: 'domain', screenTimeToday: 0, dailyLimitMinutes: 60, limitOnly: true, createdAt: Date.now() },
      ]);
    }
    refresh();
  };

  const handleStartFocus = () => { chrome.runtime.sendMessage({ type: 'START_FOCUS' }, () => refresh()); };
  const handleStopFocus = () => { chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, () => refresh()); };
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    window.close();
  };

  const isCurrentBlocked = !!currentDomain && store.blockedItems.some((b) => b.url === currentDomain && !b.limitOnly);
  const isCurrentLimited = !!currentDomain && store.blockedItems.some((b) => b.url === currentDomain && b.limitOnly);
  const { focusMode } = store;

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const todayInsights = store.insights.filter((e) => e.date === today);
  const totalMins = todayInsights.reduce((s, e) => s + e.totalMinutes, 0);
  const topSites = [...todayInsights].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 3);
  const limitsHitToday = store.blockedItems.filter(
    (b) => b.dailyLimitMinutes !== undefined && b.screenTimeToday >= b.dailyLimitMinutes
  ).length;

  return (
    <div className="font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col" style={{ width: 340, minHeight: 480 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 7v7c0 5 3.7 10 9 11.4C17.3 24 21 19 21 14V7l-9-5z" />
            </svg>
          </div>
          <span className="font-bold text-sm text-white">SiteBlocker Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">Blocking</span>
          <button
            onClick={handleToggleBlocking}
            className={clsx(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              store.settings.blockingEnabled ? 'bg-white/30' : 'bg-black/20'
            )}
          >
            <span className={clsx('inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform', store.settings.blockingEnabled ? 'translate-x-5' : 'translate-x-1')} />
          </button>
        </div>
      </div>

      {/* Current site */}
      {currentDomain && (
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FaviconImage domain={currentDomain} size={18} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{currentDomain}</div>
                {(() => {
                  const ins = todayInsights.find((e) => e.domain === currentDomain || e.domain === `www.${currentDomain}`);
                  return ins ? <div className="text-xs text-gray-400">{formatMins(ins.totalMinutes)} today</div> : null;
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isCurrentBlocked ? (
                <span className="badge bg-red-100 text-red-700 text-xs">Blocked</span>
              ) : isCurrentLimited ? (
                <span className="badge bg-orange-100 text-orange-700 text-xs">Limited</span>
              ) : (
                <>
                  <button onClick={handleBlockCurrent} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md font-medium transition-colors">Block</button>
                  <button onClick={handleAddUsageLimit} className="text-xs bg-orange-400 hover:bg-orange-500 text-white px-2.5 py-1 rounded-md font-medium transition-colors">Limit</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {(['home', 'sites'] as const).map((t) => (
          <button key={t} onClick={() => setView(t)}
            className={clsx('flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors', view === t ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50' : 'text-gray-400 hover:text-gray-600')}>
            {t === 'home' ? 'Overview' : 'Blocked Sites'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'home' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800">
              {[
                { label: 'Browsing', value: formatMins(totalMins) },
                { label: 'Blocked', value: String(store.blockedItems.filter(b => !b.limitOnly).length) },
                { label: 'Limits hit', value: String(limitsHitToday) },
              ].map((s, i) => (
                <div key={s.label} className={clsx('flex flex-col items-center py-3', i < 2 && 'border-r border-gray-100 dark:border-gray-800')}>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Focus mode */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Focus Mode</span>
                {focusMode.isActive && (
                  <span className={clsx('badge text-xs', focusMode.phase === 'work' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                    {focusMode.phase === 'work' ? 'ðŸŽ¯ Focusing' : 'â˜• Break'}
                  </span>
                )}
              </div>
              {focusMode.isActive ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-2xl font-bold">{formatCountdown(focusSecondsLeft)}</div>
                    <div className="text-xs text-gray-400">Session {focusMode.currentSession} of {focusMode.totalSessions}</div>
                  </div>
                  <button onClick={handleStopFocus} className="btn-secondary text-xs py-1.5 px-3">Stop</button>
                </div>
              ) : (
                <button onClick={handleStartFocus} className="btn-primary w-full text-sm py-2">
                  â–¶ Start Focus ({store.focusMode.workMinutes}m)
                </button>
              )}
            </div>

            {/* Top sites today */}
            <div className="px-4 py-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Sites Today</div>
              {topSites.length > 0 ? (
                <div className="space-y-2">
                  {topSites.map((s) => {
                    const pct = totalMins > 0 ? Math.min(100, (s.totalMinutes / totalMins) * 100) : 0;
                    return (
                      <div key={s.domain} className="flex items-center gap-2">
                        <FaviconImage domain={s.domain} size={14} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="truncate text-gray-700 dark:text-gray-300">{s.domain}</span>
                            <span className="text-gray-400 ml-1 flex-shrink-0">{formatMins(s.totalMinutes)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">No browsing tracked today yet</p>
              )}
            </div>
          </>
        )}

        {view === 'sites' && (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {store.blockedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">No blocked sites yet</div>
            ) : (
              store.blockedItems.map((item) => {
                const isOverLimit = item.dailyLimitMinutes !== undefined && item.screenTimeToday >= item.dailyLimitMinutes;
                return (
                  <div key={item.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <FaviconImage domain={item.url} size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.url}</div>
                      {item.dailyLimitMinutes && (
                        <div className="text-xs text-gray-400">{formatMins(item.screenTimeToday)} / {formatMins(item.dailyLimitMinutes)}</div>
                      )}
                    </div>
                    {isOverLimit && <span className="badge bg-red-100 text-red-600 text-[10px]">Limit hit</span>}
                    {!item.limitOnly && !isOverLimit && <span className="badge bg-gray-100 text-gray-500 text-[10px]">Blocked</span>}
                    {item.limitOnly && !isOverLimit && <span className="badge bg-orange-50 text-orange-500 text-[10px]">Limited</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
        <button onClick={openDashboard} className="btn-secondary w-full text-sm py-2">
          Open Dashboard â†’
        </button>
      </div>
    </div>
  );
}
