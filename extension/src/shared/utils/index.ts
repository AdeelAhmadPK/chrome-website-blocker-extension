/** Normalize a user-entered URL to a plain hostname */
export function normalizeDomain(input: string): string {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    const hostname = new URL(url).hostname;
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch {
    // fallback: strip protocol / www manually
    return input
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();
  }
}

/** Get today's date string "YYYY-MM-DD" */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Format minutes as "Xh Ym" or "Ym" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Format seconds remaining as "MM:SS" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Get favicon URL for a domain */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
}

/** Check if a schedule is currently active */
export function isScheduleActive(schedule: { days: string[]; startTime: string; endTime: string }): boolean {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = days[now.getDay()];
  if (!schedule.days.includes(today)) return false;

  const [sh, sm] = schedule.startTime.split(':').map(Number);
  const [eh, em] = schedule.endTime.split(':').map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (end > start) return current >= start && current < end;
  // overnight schedule
  return current >= start || current < end;
}
