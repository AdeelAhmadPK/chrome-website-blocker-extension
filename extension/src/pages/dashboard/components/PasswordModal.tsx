import React, { useState, useRef, useEffect } from 'react';
import { sha256 } from '../../../shared/utils/hash';
import { useStore } from '../context/StoreContext';
import { updatePassword } from '../../../shared/storage/store';

interface PasswordModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const LOCKOUT_DURATION_MS = 10 * 60 * 1000;

export default function PasswordModal({ onSuccess, onCancel }: PasswordModalProps) {
  const { store } = useStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { password } = store;

    // Check lockout
    if (password.lockedUntil && Date.now() < password.lockedUntil) {
      const mins = Math.ceil((password.lockedUntil - Date.now()) / 60000);
      setError(`Too many attempts. Try again in ${mins} minute(s).`);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400)); // brute-force delay
    const hash = await sha256(value);
    setLoading(false);

    if (hash === password.hash) {
      await updatePassword({ failedAttempts: 0, lockedUntil: undefined });
      onSuccess();
    } else {
      const attempts = (password.failedAttempts || 0) + 1;
      if (attempts >= 5) {
        await updatePassword({ failedAttempts: 0, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
        setError('Too many wrong attempts. Locked for 10 minutes.');
      } else {
        await updatePassword({ failedAttempts: attempts });
        setError(`Incorrect password. ${5 - attempts} attempt(s) remaining.`);
      }
      setValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Password Required</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your password to make changes.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            placeholder="Password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            className="input"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading || !value}>
              {loading ? 'Checking...' : 'Unlock'}
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
