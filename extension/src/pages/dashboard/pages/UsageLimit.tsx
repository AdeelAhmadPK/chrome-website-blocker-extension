import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { updateBlockedItems } from '../../../shared/storage/store';
import type { BlockedItem } from '../../../shared/types';
import { normalizeDomain, generateId, formatMinutes } from '../../../shared/utils';
import FaviconImage from '../components/FaviconImage';
import { clsx } from 'clsx';

const LIMIT_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: 'Custom', value: -1 },
];

function UsageProgressBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const left = Math.max(0, limit - used);
  const isOver = used >= limit;
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-500' : 'bg-primary-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={clsx('text-xs whitespace-nowrap', isOver ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400')}>
        {isOver ? 'Blocked' : `${formatMinutes(left)} left`}
      </span>
    </div>
  );
}

export default function UsageLimit() {
  const { store } = useStore();
  const [addInput, setAddInput] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  // Items that have a daily limit set
  const limitedItems = store.blockedItems.filter((b) => b.dailyLimitMinutes !== undefined);
  // All blocked items (for the add picker)
  const allItems = store.blockedItems;

  const handleAddByUrl = async () => {
    const url = normalizeDomain(addInput.trim());
    if (!url) return;
    const existing = store.blockedItems.find((b) => b.url === url);
    if (existing) {
      // Set a default 60 min limit but keep it as limitOnly if it wasn't already blocked
      const updated = store.blockedItems.map((b) =>
        b.url === url ? { ...b, dailyLimitMinutes: 60, limitOnly: b.limitOnly ?? true } : b
      );
      await updateBlockedItems(updated);
    } else {
      const item: BlockedItem = {
        id: generateId(),
        url,
        type: 'domain',
        screenTimeToday: 0,
        dailyLimitMinutes: 60,
        limitOnly: true,
        createdAt: Date.now(),
      };
      await updateBlockedItems([...store.blockedItems, item]);
    }
    setAddInput('');
  };

  const handleSetLimit = async (id: string, minutes: number) => {
    const updated = store.blockedItems.map((b) =>
      b.id === id ? { ...b, dailyLimitMinutes: minutes } : b
    );
    await updateBlockedItems(updated);
  };

  const handleCustomLimit = async (id: string) => {
    const val = parseInt(customValues[id] ?? '');
    if (isNaN(val) || val <= 0) return;
    await handleSetLimit(id, val);
    setCustomValues((prev) => ({ ...prev, [id]: '' }));
  };

  const handleRemoveLimit = async (id: string) => {
    const updated = store.blockedItems.map((b) => {
      if (b.id === id) {
        const { dailyLimitMinutes: _, ...rest } = b;
        return rest as BlockedItem;
      }
      return b;
    });
    await updateBlockedItems(updated);
  };

  const handleRedirect = async () => {
    const { updateCustomBlockPage } = await import('../../../shared/storage/store');
    const url = window.prompt('Enter redirect URL for blocked pages:', store.customBlockPage.redirectUrl ?? '');
    if (url !== null) {
      await updateCustomBlockPage({ redirectUrl: url, mode: url ? 'redirect' : store.customBlockPage.mode });
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Limit</h1>
        <button onClick={handleRedirect} className="btn-secondary text-xs">
          Redirect
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Set daily time limits for specific websites. Once you reach your limit, access will be blocked until the next day.
      </p>

      {/* Add */}
      <div className="flex gap-2 mb-6">
        <input
          className="input flex-1"
          placeholder="Enter a website to add a time limit (e.g. youtube.com)"
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddByUrl()}
        />
        <button className="btn-primary" onClick={handleAddByUrl}>+ Add to Block List</button>
      </div>

      {/* Table */}
      {limitedItems.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="font-medium">No usage limits set</p>
          <p className="text-sm mt-1">Add a website above and set a daily time budget.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Screen time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Daily limit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Usage status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {limitedItems.map((item, i) => {
                const limit = item.dailyLimitMinutes!;
                const used = item.screenTimeToday ?? 0;
                const isCustom = !LIMIT_OPTIONS.some((o) => o.value === limit && o.value !== -1);

                return (
                  <tr
                    key={item.id}
                    className={clsx(
                      'border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30',
                      i === limitedItems.length - 1 && 'border-b-0'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FaviconImage domain={item.url} />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">{item.url}</div>
                          <div className="text-xs text-gray-400">Website</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {used > 0 ? formatMinutes(used) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isCustom ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={customValues[item.id] ?? limit}
                            onChange={(e) => setCustomValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="input w-20 py-1"
                          />
                          <span className="text-xs text-gray-400">min</span>
                          <button className="text-xs btn-primary py-1 px-2" onClick={() => handleCustomLimit(item.id)}>Set</button>
                        </div>
                      ) : (
                        <select
                          value={limit}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (v === -1) {
                              setCustomValues((prev) => ({ ...prev, [item.id]: String(limit) }));
                              handleSetLimit(item.id, -1);
                            } else {
                              handleSetLimit(item.id, v);
                            }
                          }}
                          className="input py-1 w-36"
                        >
                          {LIMIT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {used > 0 ? (
                        <UsageProgressBar used={used} limit={limit} />
                      ) : (
                        <span className="text-gray-400 text-xs">No usage today</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveLimit(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                        title="Remove limit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick-add from existing blocked items */}
      {allItems.filter((b) => b.dailyLimitMinutes === undefined).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add limit to existing blocked sites:
          </h3>
          <div className="flex flex-wrap gap-2">
            {allItems
              .filter((b) => b.dailyLimitMinutes === undefined)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSetLimit(item.id, 60)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 text-sm text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                >
                  <FaviconImage domain={item.url} size={14} />
                  {item.url}
                  <span className="text-primary-500">+</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
