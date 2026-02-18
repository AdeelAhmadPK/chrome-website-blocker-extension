import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { updateCustomBlockPage } from '../../../shared/storage/store';
import type { BlockPageMode } from '../../../shared/types';
import { clsx } from 'clsx';

const MODES: { id: BlockPageMode; label: string; desc: string }[] = [
  { id: 'default', label: 'Default', desc: 'Clean red block page' },
  { id: 'motivational', label: 'Motivational', desc: 'Inspiring message' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean & simple' },
  { id: 'meme', label: 'Meme', desc: 'Fun distraction' },
  { id: 'redirect', label: 'Redirect', desc: 'Go to another URL' },
  { id: 'custom', label: 'Custom', desc: 'Your own design' },
];

function BlockPagePreview({ mode, message, backgroundColor, redirectUrl }: {
  mode: BlockPageMode; message?: string; backgroundColor?: string; redirectUrl?: string;
}) {
  const bg = mode === 'minimalist' ? '#fff' : mode === 'custom' && backgroundColor ? backgroundColor : '#fff';

  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden"
      style={{ background: bg, minHeight: 220 }}
    >
      {mode === 'default' && (
        <div className="flex flex-col items-center justify-center h-full py-12 bg-gradient-to-b from-red-50 to-white">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 7v7c0 5 3.7 10 9 11.4C17.3 24 21 19 21 14V7l-9-5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Site Blocked</h2>
          <p className="text-sm text-gray-500 mt-1">example.com</p>
        </div>
      )}
      {mode === 'motivational' && (
        <div className="flex flex-col items-center justify-center h-full py-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-center px-6">
          <p className="text-base font-semibold">{message || 'Stay focused! You can do it.'}</p>
          <p className="text-sm opacity-75 mt-2">example.com is blocked</p>
        </div>
      )}
      {mode === 'minimalist' && (
        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
          <p className="text-2xl font-light">Blocked</p>
          <p className="text-sm mt-1">example.com</p>
        </div>
      )}
      {mode === 'meme' && (
        <div className="flex flex-col items-center justify-center h-full py-12 bg-yellow-50 text-center px-4">
          <p className="font-bold text-gray-800">Not today!</p>
          <p className="text-sm text-gray-500 mt-1">Back to work!</p>
        </div>
      )}
      {mode === 'redirect' && (
        <div className="flex flex-col items-center justify-center h-full py-12 bg-green-50 text-center px-4">
          <p className="font-semibold text-gray-800">Redirecting you to:</p>
          <p className="text-sm text-green-600 mt-1 break-all">{redirectUrl || 'your chosen URL'}</p>
        </div>
      )}
      {mode === 'custom' && (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4" style={{ background: backgroundColor }}>
          <p className="font-semibold text-gray-800">{message || 'Site Blocked'}</p>
          <p className="text-sm text-gray-500 mt-1">example.com</p>
        </div>
      )}
    </div>
  );
}

export default function CustomBlockPage() {
  const { store } = useStore();
  const config = store.customBlockPage;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = async (partial: typeof config | Partial<typeof config>) => {
    setSaving(true);
    await updateCustomBlockPage(partial);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Image must be under 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => update({ imageBase64: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Custom Block Page</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Customize what users see when a site is blocked. Changes save automatically.
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Config panel */}
        <div className="space-y-5">
          {/* Mode selector */}
          <div className="card">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm">Page Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update({ mode: m.id })}
                  className={clsx(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all',
                    config.mode === m.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                  )}
                >
                  <div className="text-left">
                    <div className="font-medium text-xs">{m.label}</div>
                    <div className="text-gray-400 text-[10px]">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          {(config.mode === 'motivational' || config.mode === 'custom') && (
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={config.message ?? ''}
                onChange={(e) => update({ message: e.target.value })}
                placeholder="Enter your motivational message..."
              />
            </div>
          )}

          {/* Background color */}
          {config.mode === 'custom' && (
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.backgroundColor ?? '#ffffff'}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  className="h-9 w-16 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{config.backgroundColor ?? '#ffffff'}</span>
              </div>
            </div>
          )}

          {/* Image upload */}
          {config.mode === 'custom' && (
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Image (max 500KB)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
              {config.imageBase64 && (
                <div className="mt-2">
                  <img src={config.imageBase64} alt="Preview" className="h-16 rounded object-cover" />
                  <button onClick={() => update({ imageBase64: undefined })} className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                </div>
              )}
            </div>
          )}

          {/* Redirect URL */}
          {config.mode === 'redirect' && (
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Redirect URL</label>
              <input
                className="input"
                placeholder="https://example.com"
                value={config.redirectUrl ?? ''}
                onChange={(e) => update({ redirectUrl: e.target.value })}
              />
              <label className="block text-xs text-gray-500 mt-3 mb-1">Redirect delay (seconds)</label>
              <input
                type="number" min={0} max={30}
                className="input w-24"
                value={config.redirectDelay ?? 3}
                onChange={(e) => update({ redirectDelay: Number(e.target.value) })}
              />
            </div>
          )}

          {saved && (
            <div className="text-sm text-green-600 font-medium">Saved</div>
          )}
        </div>

        {/* Preview panel */}
        <div>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-3">Live Preview</h3>
          <BlockPagePreview
            mode={config.mode}
            message={config.message}
            backgroundColor={config.backgroundColor}
            redirectUrl={config.redirectUrl}
          />
        </div>
      </div>
    </div>
  );
}
