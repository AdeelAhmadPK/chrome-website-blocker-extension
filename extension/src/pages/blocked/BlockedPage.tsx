import React, { useEffect, useState } from 'react';
import type { CustomBlockPageConfig } from '../../shared/types';

const DEFAULT_CONFIG: CustomBlockPageConfig = {
  mode: 'default',
  message: 'Stay focused! You can do it.',
  backgroundColor: '#ffffff',
  redirectDelay: 3,
};

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' },
  limit: { label: 'Daily Limit Reached', color: 'bg-orange-100 text-orange-700' },
  schedule: { label: 'Blocked by Schedule', color: 'bg-blue-100 text-blue-700' },
  focus: { label: 'Focus Session Active', color: 'bg-purple-100 text-purple-700' },
};

export default function BlockedPage() {
  const params = new URLSearchParams(window.location.search);
  const site = decodeURIComponent(params.get('site') ?? 'this site');
  const reason = params.get('reason') ?? 'blocked';
  const isPreview = params.get('preview') === '1';

  const [config, setConfig] = useState<CustomBlockPageConfig>(DEFAULT_CONFIG);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    chrome.storage.local.get('customBlockPage', (res) => {
      if (res.customBlockPage) {
        setConfig({ ...DEFAULT_CONFIG, ...res.customBlockPage });
      }
    });
  }, []);

  // Redirect countdown
  useEffect(() => {
    if (config.mode !== 'redirect' || !config.redirectUrl || isPreview) return;
    const delay = config.redirectDelay ?? 3;
    setCountdown(delay);
    let c = delay;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        window.location.href = config.redirectUrl!;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, config.redirectUrl, config.redirectDelay, isPreview]);

  const reasonInfo = REASON_LABELS[reason] ?? REASON_LABELS.blocked;

  // ─── Default Mode ─────────────────────────────────────────────────────────
  if (config.mode === 'default' || !config.mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white font-sans">
        <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.35C17.25 24.15 21 19.25 21 14V7l-9-5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Blocked</h1>
        <p className="text-gray-500 text-sm mb-4">{site}</p>
        <span className={`badge text-sm px-3 py-1 ${reasonInfo.color}`}>{reasonInfo.label}</span>
        <MessageByReason reason={reason} />
        <button onClick={() => window.history.back()} className="mt-8 btn-secondary">← Go Back</button>
        {isPreview && <p className="mt-4 text-xs text-gray-400">Preview mode</p>}
      </div>
    );
  }

  // ─── Motivational ─────────────────────────────────────────────────────────
  if (config.mode === 'motivational') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 font-sans text-white text-center px-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h2 className="text-2xl font-bold mb-3">{config.message || 'Stay focused!'}</h2>
        <p className="text-blue-200 mb-2 text-sm">{site} is blocked</p>
        <span className={`badge text-sm px-3 py-1 bg-white/20 text-white`}>{reasonInfo.label}</span>
        <button onClick={() => window.history.back()} className="mt-8 btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20">← Go Back</button>
      </div>
    );
  }

  // ─── Minimalist ───────────────────────────────────────────────────────────
  if (config.mode === 'minimalist') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans text-center">
        <p className="text-4xl font-light text-gray-300 mb-2">Blocked</p>
        <p className="text-gray-400 text-sm">{site}</p>
        <button onClick={() => window.history.back()} className="mt-8 text-xs text-gray-400 hover:text-gray-600">Go Back</button>
      </div>
    );
  }

  // ─── Meme ─────────────────────────────────────────────────────────────────
  if (config.mode === 'meme') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 font-sans text-center px-6">
      <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Not today!</h2>
      <p className="text-gray-500 mb-1">{site}</p>
      <p className="text-gray-400 text-sm">Back to work!</p>
        <button onClick={() => window.history.back()} className="mt-8 btn-secondary">← Go Back</button>
      </div>
    );
  }

  // ─── Redirect ─────────────────────────────────────────────────────────────
  if (config.mode === 'redirect') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 font-sans text-center px-6">
      <svg className="w-14 h-14 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting you…</h2>
        <p className="text-sm text-gray-500 mb-1">{site} is blocked</p>
        {config.redirectUrl && <p className="text-green-600 text-sm break-all">{config.redirectUrl}</p>}
        {countdown !== null && (
          <p className="text-2xl font-bold text-green-600 mt-4">{countdown}</p>
        )}
        {isPreview && <p className="mt-4 text-xs text-gray-400">Preview — redirect disabled</p>}
      </div>
    );
  }

  // ─── Custom ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-sans text-center px-6"
      style={{
        background: config.imageBase64
          ? `url(${config.imageBase64}) center/cover no-repeat`
          : config.backgroundColor ?? '#fff',
      }}
    >
      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-10 max-w-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.message || 'Site Blocked'}</h2>
        <p className="text-gray-500 text-sm">{site}</p>
        <button onClick={() => window.history.back()} className="mt-6 btn-secondary">← Go Back</button>
      </div>
    </div>
  );
}

function MessageByReason({ reason }: { reason: string }) {
  if (reason === 'limit') return <p className="text-xs text-gray-400 mt-2">You've reached your daily limit. It resets at midnight.</p>;
  if (reason === 'schedule') return <p className="text-xs text-gray-400 mt-2">This site is blocked during your scheduled hours.</p>;
  if (reason === 'focus') return <p className="text-xs text-gray-400 mt-2">A focus session is active. Hang in there!</p>;
  return null;
}
