import React, { useState } from 'react';
import { getFaviconUrl } from '../../../shared/utils';

interface FaviconProps {
  domain: string;
  size?: number;
  className?: string;
}

export default function FaviconImage({ domain, size = 20, className = '' }: FaviconProps) {
  const [failed, setFailed] = useState(false);
  const initial = domain.charAt(0).toUpperCase();

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold text-xs flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={getFaviconUrl(domain)}
      alt={domain}
      width={size}
      height={size}
      className={`rounded flex-shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
