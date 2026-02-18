import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { updateSettings } from '../../../shared/storage/store';
import { formatMinutes, todayString } from '../../../shared/utils';
import type { InsightEntry } from '../../../shared/types';
import { updateBlockedItems } from '../../../shared/storage/store';
import { generateId } from '../../../shared/utils';
import FaviconImage from '../components/FaviconImage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Range = '1d' | '7d' | '30d';

const COLORS = ['#E8453C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

function dateRange(range: Range): string[] {
  const today = new Date();
  const days: string[] = [];
  const count = range === '1d' ? 1 : range === '7d' ? 7 : 30;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function aggregateByDomain(entries: InsightEntry[], dates: string[]) {
  const dateSet = new Set(dates);
  const map: Record<string, { domain: string; minutes: number; visits: number }> = {};
  for (const e of entries) {
    if (!dateSet.has(e.date)) continue;
    if (!map[e.domain]) map[e.domain] = { domain: e.domain, minutes: 0, visits: 0 };
    map[e.domain].minutes += e.totalMinutes;
    map[e.domain].visits += e.visitCount;
  }
  return Object.values(map).sort((a, b) => b.minutes - a.minutes);
}

function aggregateByDay(entries: InsightEntry[], dates: string[]) {
  const map: Record<string, number> = {};
  for (const day of dates) map[day] = 0;
  for (const e of entries) {
    if (e.date in map) map[e.date] = (map[e.date] ?? 0) + e.totalMinutes;
  }
  return dates.map((d) => ({
    date: d.slice(5), // MM-DD
    minutes: Math.round(map[d] ?? 0),
  }));
}

export default function Insights() {
  const { store } = useStore();
  const [range, setRange] = useState<Range>('7d');

  const dates = useMemo(() => dateRange(range), [range]);
  const domainData = useMemo(() => aggregateByDomain(store.insights, dates), [store.insights, dates]);
  const dayData = useMemo(() => aggregateByDay(store.insights, dates), [store.insights, dates]);

  const totalMinutes = useMemo(() => domainData.reduce((s, d) => s + d.minutes, 0), [domainData]);
  const topSite = domainData[0]?.domain ?? '—';
  const blockedDomains = new Set(store.blockedItems.map((b) => b.url));
  const blockedMinutes = useMemo(
    () => domainData.filter((d) => blockedDomains.has(d.domain)).reduce((s, d) => s + d.minutes, 0),
    [domainData, blockedDomains]
  );

  const suggestions = useMemo(
    () =>
      domainData
        .filter((d) => !blockedDomains.has(d.domain) && !store.settings.dismissedSuggestions?.includes(d.domain))
        .slice(0, 5),
    [domainData, blockedDomains, store.settings.dismissedSuggestions]
  );

  const handleBlockSuggestion = async (domain: string) => {
    const already = store.blockedItems.find((b) => b.url === domain);
    if (!already) {
      await updateBlockedItems([
        ...store.blockedItems,
        { id: generateId(), url: domain, type: 'domain', screenTimeToday: 0, createdAt: Date.now() },
      ]);
    }
  };

  const handleDismissSuggestion = async (domain: string) => {
    await updateSettings({
      dismissedSuggestions: [...(store.settings.dismissedSuggestions ?? []), domain],
    });
  };

  const pieData = domainData.slice(0, 6).map((d) => ({ name: d.domain, value: Math.round(d.minutes) }));

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your browsing activity overview.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['1d', '7d', '30d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {r === '1d' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Online', value: formatMinutes(totalMinutes) },
          { label: 'Top Site', value: topSite },
          { label: 'On Blocked Sites', value: formatMinutes(blockedMinutes) },
          { label: 'Time Saved', value: formatMinutes(blockedMinutes) },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{s.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Daily Browsing Time</h3>
          {dayData.every((d) => d.minutes === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="m" />
                <Tooltip formatter={(v: number) => [`${v}m`, 'Time']} />
                <Bar dataKey="minutes" fill="#E8453C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Top Sites</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="40%" cy="50%" outerRadius={60} dataKey="value" label={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value: string) => (
                    <span style={{ fontSize: 10 }}>{value.length > 20 ? value.slice(0, 18) + '…' : value}</span>
                  )}
                />
                <Tooltip formatter={(v: number) => [`${Math.round(v)}m`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-domain table */}
      {domainData.length > 0 && (
        <div className="card p-0 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Domain</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Visits</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Share</th>
              </tr>
            </thead>
            <tbody>
              {domainData.slice(0, 20).map((d, i) => (
                <tr key={d.domain} className={`border-b border-gray-50 dark:border-gray-700/50 ${i === Math.min(19, domainData.length - 1) ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FaviconImage domain={d.domain} size={16} />
                      <span className="text-gray-800 dark:text-gray-200">{d.domain}</span>
                      {blockedDomains.has(d.domain) && <span className="badge bg-red-100 text-red-600 text-[10px]">Blocked</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">{d.visits}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-800 dark:text-gray-200">{formatMinutes(d.minutes)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full"
                          style={{ width: `${totalMinutes > 0 ? (d.minutes / totalMinutes) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {totalMinutes > 0 ? Math.round((d.minutes / totalMinutes) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Sites You Might Want to Block</h3>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.domain} className="flex items-center gap-3">
                <FaviconImage domain={s.domain} size={18} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.domain}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{formatMinutes(s.minutes)} this period</span>
                </div>
                <button onClick={() => handleBlockSuggestion(s.domain)} className="btn-primary py-1 text-xs">Block</button>
                <button onClick={() => handleDismissSuggestion(s.domain)} className="btn-ghost py-1 text-xs">Ignore</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.insights.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <p className="font-medium">No browsing data yet</p>
          <p className="text-sm mt-1">Browse the web and data will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
