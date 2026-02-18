import React, { useState } from 'react';
import { clsx } from 'clsx';
import { setStore } from '../../../shared/storage/store';
import { normalizeDomain, generateId } from '../../../shared/utils';

interface Props {
  onClose: () => void;
}

const steps = [
  {
    title: 'Welcome to SiteBlocker Pro 🎉',
    desc: 'Your free, privacy-first focus tool. Let\'s get you set up in under a minute.',
    icon: '🛡️',
  },
  {
    title: 'Block distracting sites',
    desc: 'Add the sites you want to block. You can always add more from the dashboard.',
    icon: '🚫',
  },
  {
    title: 'Set time limits',
    desc: 'Want to allow some time on social media? Set a daily budget — once you hit it, the site\'s blocked until midnight.',
    icon: '⏱️',
  },
  {
    title: 'Use Focus Mode',
    desc: 'Start a Pomodoro session to supercharge your productivity. All sites except your whitelist get blocked during work intervals.',
    icon: '🎯',
  },
  {
    title: 'You\'re all set!',
    desc: 'SiteBlocker Pro stores everything locally — no account, no sync, no tracking.',
    icon: '✅',
  },
];

const COMMON_SITES = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'youtube.com', 'reddit.com', 'tiktok.com', 'netflix.com'];

export default function Onboarding({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [limitSites, setLimitSites] = useState<string[]>([]);

  const isLast = step === steps.length - 1;

  const toggleSite = (site: string) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  };

  const toggleLimit = (site: string) => {
    setLimitSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  };

  const addCustom = () => {
    const d = normalizeDomain(customInput.trim());
    if (d && !selectedSites.includes(d)) {
      setSelectedSites((p) => [...p, d]);
    }
    setCustomInput('');
  };

  const finish = async () => {
    const items = selectedSites.map((url) => ({
      id: generateId(),
      url,
      type: 'domain' as const,
      screenTimeToday: 0,
      dailyLimitMinutes: limitSites.includes(url) ? 60 : undefined,
      limitOnly: limitSites.includes(url) ? true : undefined,
      createdAt: Date.now(),
    }));
    if (items.length > 0) {
      const { updateBlockedItems } = await import('../../../shared/storage/store');
      await updateBlockedItems(items);
    }
    await setStore({ onboardingCompleted: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="px-8 py-6">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={clsx('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}
              />
            ))}
          </div>

          {/* Icon + title */}
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">{steps[step].icon}</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{steps[step].title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">{steps[step].desc}</p>
          </div>

          {/* Step content */}
          {step === 1 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Common distractions</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_SITES.map((site) => (
                  <button
                    key={site}
                    onClick={() => toggleSite(site)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      selectedSites.includes(site)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300'
                    )}
                  >
                    {selectedSites.includes(site) ? '✓ ' : ''}{site}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm py-1.5"
                  placeholder="Add custom site (e.g. example.com)"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                />
                <button onClick={addCustom} className="btn-primary py-1.5 px-3 text-sm">Add</button>
              </div>
            </div>
          )}

          {step === 2 && selectedSites.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Which should be limited (60 min/day) instead of fully blocked?</p>
              <div className="flex flex-wrap gap-2">
                {selectedSites.map((site) => (
                  <button
                    key={site}
                    onClick={() => toggleLimit(site)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      limitSites.includes(site)
                        ? 'bg-orange-400 border-orange-400 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300'
                    )}
                  >
                    {limitSites.includes(site) ? '⏱ ' : ''}{site}
                  </button>
                ))}
              </div>
              {selectedSites.length === 0 && (
                <p className="text-sm text-slate-400">No sites selected in the previous step.</p>
              )}
            </div>
          )}

          {step === 2 && selectedSites.length === 0 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              No sites were selected. You can add them later from the dashboard.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 pb-6 flex justify-between items-center">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="btn-ghost text-sm"
          >
            {step === 0 ? 'Skip' : '← Back'}
          </button>
          <button
            onClick={() => isLast ? finish() : setStep(step + 1)}
            className="btn-primary px-6"
          >
            {isLast ? 'Get Started →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
