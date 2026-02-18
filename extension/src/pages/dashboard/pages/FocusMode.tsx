import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { updateFocusMode } from '../../../shared/storage/store';
import type { FocusModeConfig } from '../../../shared/types';
import { normalizeDomain, formatCountdown } from '../../../shared/utils';
import { clsx } from 'clsx';

function CircleTimer({ secondsLeft, totalSeconds, phase }: { secondsLeft: number; totalSeconds: number; phase: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={phase === 'work' ? '#E8453C' : '#10B981'}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
          {formatCountdown(secondsLeft)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{phase}</span>
      </div>
    </div>
  );
}

export default function FocusModeePage() {
  const { store } = useStore();
  const [config, setConfig] = useState<FocusModeConfig>(store.focusMode);
  const [whitelist, setWhitelist] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setConfig(store.focusMode);
  }, [store.focusMode]);

  // Real-time countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (config.isActive && config.phaseEndsAt) {
      const update = () => {
        const left = Math.max(0, Math.round((config.phaseEndsAt! - Date.now()) / 1000));
        setSecondsLeft(left);
      };
      update();
      timerRef.current = setInterval(update, 1000);
    } else {
      setSecondsLeft(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [config.isActive, config.phaseEndsAt]);

  // Listen for background state updates
  useEffect(() => {
    const handler = (msg: { type: string; state?: FocusModeConfig }) => {
      if (msg.type === 'FOCUS_STATE_UPDATE' && msg.state) {
        setConfig(msg.state);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    // Also poll current state
    chrome.runtime.sendMessage({ type: 'GET_FOCUS_STATE' }, (resp) => {
      if (resp?.state) setConfig(resp.state);
    });
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const handleStart = () => {
    chrome.runtime.sendMessage({ type: 'START_FOCUS' });
  };

  const handleStop = () => {
    chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
  };

  const handleAddWhitelist = async () => {
    const d = normalizeDomain(whitelist.trim());
    if (!d || config.whitelistedDomains.includes(d)) return;
    await updateFocusMode({ whitelistedDomains: [...config.whitelistedDomains, d] });
    setWhitelist('');
  };

  const handleRemoveWhitelist = async (domain: string) => {
    await updateFocusMode({ whitelistedDomains: config.whitelistedDomains.filter((d) => d !== domain) });
  };

  const totalPhaseSeconds = config.phase === 'work'
    ? config.workMinutes * 60
    : config.breakMinutes * 60;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Focus Mode</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Use the Pomodoro technique to stay focused. All sites except whitelisted ones are blocked during work sessions.
      </p>

      {config.isActive ? (
        /* Active Session UI */
        <div className="card text-center py-8">
          <div className="flex justify-center mb-4">
            <CircleTimer secondsLeft={secondsLeft} totalSeconds={totalPhaseSeconds} phase={config.phase} />
          </div>
          <div className={clsx('badge text-sm px-3 py-1 mb-4 mx-auto', config.phase === 'work' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
            {config.phase === 'work' ? 'Focus Time' : 'Break Time'}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Session {config.currentSession} of {config.totalSessions}
          </p>

          {/* Session dots */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: config.totalSessions }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'w-2.5 h-2.5 rounded-full',
                  i < config.currentSession - 1
                    ? 'bg-primary-500'
                    : i === config.currentSession - 1
                    ? config.phase === 'work' ? 'bg-primary-400 ring-2 ring-primary-200' : 'bg-green-400 ring-2 ring-green-200'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            ))}
          </div>

          <button onClick={handleStop} className="btn-secondary">Stop Session</button>
        </div>
      ) : (
        /* Config UI */
        <div className="space-y-6">
          <div className="card space-y-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Session Configuration</h3>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Interval</label>
                <span className="text-sm font-semibold text-primary-600">{config.workMinutes} min</span>
              </div>
              <input
                type="range" min={5} max={90} step={5}
                value={config.workMinutes}
                onChange={(e) => updateFocusMode({ workMinutes: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5m</span><span>90m</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Interval</label>
                <span className="text-sm font-semibold text-emerald-600">{config.breakMinutes} min</span>
              </div>
              <input
                type="range" min={1} max={30} step={1}
                value={config.breakMinutes}
                onChange={(e) => updateFocusMode({ breakMinutes: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1m</span><span>30m</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sessions</label>
                <span className="text-sm font-semibold text-blue-600">{config.totalSessions}</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={config.totalSessions}
                onChange={(e) => updateFocusMode({ totalSessions: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>10</span></div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
              Total: {config.workMinutes * config.totalSessions + config.breakMinutes * (config.totalSessions - 1)} minutes
              ({config.workMinutes}m work × {config.totalSessions} + {config.breakMinutes}m break × {config.totalSessions - 1})
            </div>
          </div>

          {/* Whitelist */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Allowed Sites During Focus</h3>
            <p className="text-xs text-gray-400 mb-3">These sites will remain accessible during work sessions.</p>
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1"
                placeholder="e.g. gmail.com"
                value={whitelist}
                onChange={(e) => setWhitelist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
              />
              <button className="btn-secondary" onClick={handleAddWhitelist}>Add</button>
            </div>
            {config.whitelistedDomains.length === 0 ? (
              <p className="text-xs text-gray-400">No allowed sites — all sites blocked during focus.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {config.whitelistedDomains.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                    {d}
                    <button onClick={() => handleRemoveWhitelist(d)} className="text-gray-400 hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleStart} className="btn-primary w-full py-3 text-base">
            Start Focus Session
          </button>
        </div>
      )}
    </div>
  );
}
