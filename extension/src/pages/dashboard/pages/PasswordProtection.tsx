import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { updatePassword } from '../../../shared/storage/store';
import { sha256 } from '../../../shared/utils/hash';
import PasswordModal from '../components/PasswordModal';

export default function PasswordProtection() {
  const { store } = useStore();
  const { password } = store;

  const [showSetup, setShowSetup] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (pw !== pw2) { setError('Passwords do not match.'); return; }
    const hash = await sha256(pw);
    await updatePassword({ enabled: true, hash, failedAttempts: 0 });
    setPw(''); setPw2(''); setError(''); setShowSetup(false);
    setSuccess('Password protection enabled!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDisable = async () => {
    await updatePassword({ enabled: false, hash: '', failedAttempts: 0, lockedUntil: undefined });
    setShowDisableConfirm(false);
    setSuccess('Password protection disabled.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (pw !== pw2) { setError('Passwords do not match.'); return; }
    const hash = await sha256(pw);
    await updatePassword({ hash, failedAttempts: 0, lockedUntil: undefined });
    setPw(''); setPw2(''); setError(''); setShowChange(false);
    setSuccess('Password updated!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="p-8 max-w-xl">
      {showDisableConfirm && (
        <PasswordModal
          onSuccess={handleDisable}
          onCancel={() => setShowDisableConfirm(false)}
        />
      )}
      {showChange && (
        <PasswordModal
          onSuccess={() => setShowChange(true)}
          onCancel={() => setShowChange(false)}
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Password Protection</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Prevent others from changing your block list or settings without a password.
      </p>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm border border-green-200">
          {success}
        </div>
      )}

      {/* Status card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${password.enabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                {password.enabled
                  ? <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                  : <path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-6 0v1H9V5a1 1 0 112 0v1h-1zm0 9a1 1 0 011-1h.01a1 1 0 110 2H11a1 1 0 01-1-1z" clipRule="evenodd" />
                }
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {password.enabled ? 'Protection Enabled' : 'Protection Disabled'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {password.enabled ? 'Settings are password-protected.' : 'Anyone can modify settings.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (password.enabled) {
                setShowDisableConfirm(true);
              } else {
                setShowSetup((v) => !v);
              }
            }}
            className={password.enabled ? 'btn-secondary' : 'btn-primary'}
          >
            {password.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Setup form */}
      {!password.enabled && showSetup && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Set a Password</h3>
          <form onSubmit={handleEnable} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password (min 4 characters)</label>
              <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} className="input" placeholder="Enter password" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
              <input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setError(''); }} className="input" placeholder="Confirm password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full">Enable Protection</button>
          </form>
        </div>
      )}

      {/* Change password section */}
      {password.enabled && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Change Password</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (pw.length < 4) { setError('Password must be at least 4 characters.'); return; }
              if (pw !== pw2) { setError('Passwords do not match.'); return; }
              const hash = await sha256(pw);
              await updatePassword({ hash, failedAttempts: 0, lockedUntil: undefined });
              setPw(''); setPw2(''); setError('');
              setSuccess('Password updated!');
              setTimeout(() => setSuccess(''), 3000);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Password</label>
              <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} className="input" placeholder="New password" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
              <input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setError(''); }} className="input" placeholder="Confirm new password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-semibold mb-1">How it works</p>
        <ul className="space-y-1 text-blue-700 dark:text-blue-400 text-xs">
          <li>• Your password is hashed with SHA-256 and stored locally</li>
          <li>• After 5 wrong attempts, the extension locks for 10 minutes</li>
          <li>• To recover a forgotten password, you must reset the extension (loses all data)</li>
        </ul>
      </div>
    </div>
  );
}
