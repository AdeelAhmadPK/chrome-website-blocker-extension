import React from 'react';
import { useStore } from '../context/StoreContext';
import FaviconImage from '../components/FaviconImage';
import { clsx } from 'clsx';

function formatMins(m: number) {
  if (m < 1) return '0m';
  if (m < 60) return `${Math.round(m)}m`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={clsx('card flex flex-col gap-1', color)}>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { store } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const todayInsights = store.insights.filter((e) => e.date === today);
  const totalMinsToday = todayInsights.reduce((s, e) => s + e.totalMinutes, 0);
  const topSites = [...todayInsights].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 5);

  const blockedCount = store.blockedItems.filter((b) => !b.limitOnly).length;
  const limitedCount = store.blockedItems.filter((b) => b.limitOnly).length;
  const limitsHit = store.blockedItems.filter(
    (b) => b.dailyLimitMinutes !== undefined && b.screenTimeToday >= b.dailyLimitMinutes
  ).length;

  // Last 7 days bars
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const total = store.insights
      .filter((e) => e.date === dateStr)
      .reduce((s, e) => s + e.totalMinutes, 0);
    const label = i === 6 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });
    return { dateStr, total, label, isToday: i === 6 };
  });
  const maxMins = Math.max(...last7.map((d) => d.total), 1);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Browsing Today" value={formatMins(totalMinsToday)} sub={`${todayInsights.length} sites visited`} color="" />
        <StatCard label="Sites Blocked" value={String(blockedCount)} sub="always blocked" color="" />
        <StatCard label="Usage Limits" value={String(limitedCount)} sub={`${limitsHit} hit today`} color="" />
        <StatCard
          label="Focus Status"
          value={store.focusMode.isActive ? (store.focusMode.phase === 'work' ? '🎯 Active' : '☕ Break') : 'Idle'}
          sub={store.focusMode.isActive ? `Session ${store.focusMode.currentSession}/${store.focusMode.totalSessions}` : 'No session running'}
          color=""
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Browsing — Last 7 Days</h2>
          <div className="flex items-end gap-2 h-32">
            {last7.map((d) => {
              const pct = (d.total / maxMins) * 100;
              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-gray-400 font-medium">{d.total > 0 ? formatMins(d.total) : ''}</div>
                  <div className="w-full flex items-end" style={{ height: 80 }}>
                    <div
                      className={clsx('w-full rounded-t-md transition-all', d.isToday ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-900/50')}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className={clsx('text-[10px] font-medium', d.isToday ? 'text-primary-600' : 'text-gray-400')}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top sites today */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Top Sites Today</h2>
          {topSites.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No browsing recorded today</div>
          ) : (
            <div className="space-y-3">
              {topSites.map((s) => {
                const pct = totalMinsToday > 0 ? Math.min(100, (s.totalMinutes / totalMinsToday) * 100) : 0;
                const isBlocked = store.blockedItems.some((b) => b.url === s.domain || b.url === s.domain.replace('www.', ''));
                return (
                  <div key={s.domain} className="flex items-center gap-3">
                    <FaviconImage domain={s.domain} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{s.domain}</span>
                        <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{formatMins(s.totalMinutes)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {isBlocked && (
                      <span className="badge bg-red-100 text-red-600 text-[10px] flex-shrink-0">Blocked</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Limits status */}
      {store.blockedItems.filter((b) => b.dailyLimitMinutes !== undefined).length > 0 && (
        <div className="card mt-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Usage Limits Today</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {store.blockedItems
              .filter((b) => b.dailyLimitMinutes !== undefined)
              .map((item) => {
                const pct = Math.min(100, ((item.screenTimeToday ?? 0) / item.dailyLimitMinutes!) * 100);
                const isOver = pct >= 100;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <FaviconImage domain={item.url} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.url}</span>
                        <span className={clsx('text-xs flex-shrink-0 ml-2', isOver ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                          {formatMins(item.screenTimeToday)} / {formatMins(item.dailyLimitMinutes!)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-500' : pct > 79 ? 'bg-orange-400' : 'bg-primary-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {isOver && <span className="badge bg-red-100 text-red-600 text-[10px]">Blocked</span>}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
