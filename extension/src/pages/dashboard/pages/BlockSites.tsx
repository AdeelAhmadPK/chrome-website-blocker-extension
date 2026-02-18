import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { updateBlockedItems } from '../../../shared/storage/store';
import type { BlockedItem, DayOfWeek, Schedule } from '../../../shared/types';
import { normalizeDomain, generateId, isScheduleActive } from '../../../shared/utils';
import FaviconImage from '../components/FaviconImage';
import PasswordModal from '../components/PasswordModal';
import { BLOCK_CATEGORIES } from '../../../shared/categories';
import { clsx } from 'clsx';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ScheduleModal({
  item,
  onClose,
}: {
  item: BlockedItem;
  onClose: () => void;
}) {
  const { store } = useStore();
  const [days, setDays] = useState<DayOfWeek[]>(item.schedule?.days ?? []);
  const [startTime, setStartTime] = useState(item.schedule?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(item.schedule?.endTime ?? '17:00');

  const toggleDay = (d: DayOfWeek) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSave = async () => {
    const schedule: Schedule | undefined =
      days.length > 0 ? { days, startTime, endTime } : undefined;
    const updated = store.blockedItems.map((b) =>
      b.id === item.id ? { ...b, schedule } : b
    );
    await updateBlockedItems(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-sm mx-4">
        <h3 className="font-semibold mb-3 dark:text-white">Schedule for {item.url}</h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                days.includes(d)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
          </div>
        </div>
        {days.length === 0 && (
          <p className="text-xs text-amber-600 mb-3">No days selected — schedule will be removed.</p>
        )}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CategoryDrawer({ onClose }: { onClose: () => void }) {
  const { store } = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = async () => {
    const existing = new Set(store.blockedItems.map((b) => b.url));
    const newItems: BlockedItem[] = [];
    for (const catId of selected) {
      const cat = BLOCK_CATEGORIES.find((c) => c.id === catId);
      if (!cat) continue;
      for (const domain of cat.domains) {
        if (!existing.has(domain)) {
          newItems.push({
            id: generateId(),
            url: domain,
            type: 'domain',
            screenTimeToday: 0,
            createdAt: Date.now(),
          });
          existing.add(domain);
        }
      }
    }
    await updateBlockedItems([...store.blockedItems, ...newItems]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="font-semibold mb-1 dark:text-white">Block by Category</h3>
        <p className="text-sm text-gray-500 mb-4">Select one or more categories to block.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {BLOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={clsx(
                'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                selected.includes(cat.id)
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
              )}
            >
              <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                {cat.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={handleAdd} disabled={selected.length === 0}>
            Add {selected.length > 0 ? `(${selected.reduce((sum, id) => sum + (BLOCK_CATEGORIES.find(c => c.id === id)?.domains.length ?? 0), 0)} sites)` : ''}
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function BlockSites() {
  const { store } = useStore();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'domain' | 'keyword'>('domain');
  const [scheduleItem, setScheduleItem] = useState<BlockedItem | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const requirePassword = (action: () => Promise<void>) => {
    if (store.password.enabled) {
      setPendingAction(() => action);
      setShowPassword(true);
    } else {
      action();
    }
  };

  const handleAdd = () => {
    const raw = input.trim();
    if (!raw) return;
    const url = inputType === 'domain' ? normalizeDomain(raw) : raw.toLowerCase();
    if (store.blockedItems.some((b) => b.url === url)) {
      setInput('');
      return;
    }
    requirePassword(async () => {
      const item: BlockedItem = {
        id: generateId(),
        url,
        type: inputType,
        screenTimeToday: 0,
        createdAt: Date.now(),
      };
      await updateBlockedItems([...store.blockedItems, item]);
      setInput('');
    });
  };

  const handleDelete = (id: string) => {
    requirePassword(async () => {
      await updateBlockedItems(store.blockedItems.filter((b) => b.id !== id));
    });
  };

  const handleToggleWhitelist = async () => {
    const { updateSettings } = await import('../../../shared/storage/store');
    await updateSettings({ whitelistMode: !store.settings.whitelistMode });
    chrome.runtime.sendMessage({ type: 'REBUILD_RULES' });
  };

  return (
    <div className="p-8 max-w-4xl">
      {showPassword && (
        <PasswordModal
          onSuccess={() => {
            setShowPassword(false);
            pendingAction?.();
            setPendingAction(null);
          }}
          onCancel={() => { setShowPassword(false); setPendingAction(null); }}
        />
      )}
      {scheduleItem && (
        <ScheduleModal item={scheduleItem} onClose={() => setScheduleItem(null)} />
      )}
      {showCategories && <CategoryDrawer onClose={() => setShowCategories(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Block Sites</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCategories(true)} className="btn-secondary text-xs">
            Categories
          </button>
          <button
            onClick={handleToggleWhitelist}
            className={clsx('btn-secondary text-xs', store.settings.whitelistMode && 'border-amber-400 text-amber-600')}
          >
            {store.settings.whitelistMode ? 'Whitelist Mode ON' : 'Whitelist Mode'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {store.settings.whitelistMode
          ? 'Only listed sites are allowed. Everything else is blocked.'
          : 'Add websites or keywords to block. Use * as wildcard.'}
      </p>

      {/* Add input */}
      <div className="flex gap-2 mb-6">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden flex-1">
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value as 'domain' | 'keyword')}
            className="bg-gray-50 border-r border-gray-300 px-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            <option value="domain">Domain</option>
            <option value="keyword">Keyword</option>
          </select>
          <input
            className="flex-1 px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white"
            placeholder={inputType === 'domain' ? 'e.g. facebook.com' : 'e.g. news, sports'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button className="btn-primary" onClick={handleAdd}>+ Add</button>
      </div>

      {/* List */}
      {store.blockedItems.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <p className="font-medium">No sites blocked yet</p>
          <p className="text-sm mt-1">Add a domain or keyword above to get started.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Site / Keyword</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Schedule</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {store.blockedItems.map((item, i) => (
                <tr
                  key={item.id}
                  className={clsx(
                    'border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
                    i === store.blockedItems.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {item.type === 'domain' ? (
                        <FaviconImage domain={item.url} />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-xs text-slate-400 font-mono border border-slate-200 rounded dark:border-slate-700">K</span>
                      )}
                      <span className="font-medium text-gray-800 dark:text-gray-200">{item.url}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', item.type === 'keyword' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300')}>
                      {item.type === 'keyword' ? 'Keyword' : 'Website'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.schedule ? (
                      <button
                        onClick={() => setScheduleItem(item)}
                        className={clsx(
                          'badge cursor-pointer',
                          isScheduleActive(item.schedule)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {item.schedule.startTime}–{item.schedule.endTime}
                      </button>
                    ) : (
                      <button
                        onClick={() => setScheduleItem(item)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs transition-colors"
                      >
                        + Add schedule
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
