import React from 'react';
import { clsx } from 'clsx';
import type { Page } from '../App';
import { useStore } from '../context/StoreContext';
import { updateSettings } from '../../../shared/storage/store';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  badge?: { text: string; color: string };
  locked?: boolean;
}

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const TimerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="2" strokeWidth={2} />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const BrushIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const GearIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
  { id: 'block-sites', label: 'Block Sites', icon: <ShieldIcon /> },
  { id: 'usage-limit', label: 'Usage Limit', icon: <TimerIcon /> },
  { id: 'insights', label: 'Insights', icon: <ChartIcon />, badge: { text: 'NEW', color: 'bg-emerald-500' } },
  { id: 'focus-mode', label: 'Focus Mode', icon: <TargetIcon /> },
  { id: 'password', label: 'Password Protection', icon: <ShieldIcon />, locked: true },
  { id: 'custom-block-page', label: 'Custom Block Page', icon: <BrushIcon />, locked: true },
  { id: 'settings', label: 'Settings', icon: <GearIcon /> },
  { id: 'about', label: 'About', icon: <InfoIcon /> },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { store } = useStore();

  const handleToggleBlocking = async () => {
    await updateSettings({ blockingEnabled: !store.settings.blockingEnabled });
    chrome.runtime.sendMessage({ type: 'REBUILD_RULES' });
  };

  return (
      <aside className="w-56 flex-shrink-0 flex flex-col h-full bg-white border-r border-slate-100 dark:bg-slate-900 dark:border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.35C17.25 24.15 21 19.25 21 14V7l-9-5z" />
          </svg>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">SiteBlocker Pro</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
              currentPage === item.id
                ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className={clsx('badge text-white text-[10px]', item.badge.color)}>
                {item.badge.text}
              </span>
            )}
            {item.locked && (
              <span className="text-blue-500 flex-shrink-0">
                <LockIcon />
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom: blocking toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-3">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">All Features Unlocked</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">100% free, no account needed</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Blocking</span>
          <button
            onClick={handleToggleBlocking}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              store.settings.blockingEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                store.settings.blockingEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
