import React from 'react';

const FEATURES = [
  { label: 'Block Sites', desc: 'Block any website or keyword, with flexible schedule support' },
  { label: 'Usage Limits', desc: 'Set daily time budgets per site and stay on track' },
  { label: 'Insights', desc: 'Analyze browsing habits with bar and pie charts' },
  { label: 'Focus Mode', desc: 'Pomodoro timer with automatic site blocking during sessions' },
  { label: 'Password Protection', desc: 'SHA-256 hashed, brute-force resistant settings lock' },
  { label: 'Custom Block Page', desc: 'Fully customizable page shown when a site is blocked' },
];

export default function About() {
  return (
    <div className="p-8 max-w-xl">
      {/* Identity */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.35C17.25 24.15 21 19.25 21 14V7l-9-5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">SiteBlocker Pro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Version 1.0.0 &mdash; Free &amp; Open Source</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        SiteBlocker Pro is a full-featured website blocker for Chrome, Firefox, and Edge.
        Block distracting sites, set daily time limits, analyze your browsing habits,
        and stay focused with Pomodoro-style sessions — 100% free with no account needed.
      </p>

      {/* Feature list */}
      <div className="card p-0 overflow-hidden mb-6">
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-start gap-3 px-5 py-4 ${i < FEATURES.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{f.label}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400"> — {f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div className="card bg-slate-50 dark:bg-slate-800/50 mb-8">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-sm">Privacy</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          SiteBlocker Pro stores all data locally in your browser using{' '}
          <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-700 dark:text-slate-300">
            chrome.storage.local
          </code>
          . No data is sent to external servers. No account required. No tracking, no analytics.
        </p>
      </div>

      {/* Credits */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p>
          Designed &amp; built by{' '}
          <a
            href="https://adeelahmad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:text-primary-600 font-medium underline decoration-dotted"
          >
            Muhammad Adeel
          </a>
        </p>
        <p>&copy; 2026 Muhammad Adeel &mdash; adeelahmad.com</p>
      </div>
    </div>
  );
}
