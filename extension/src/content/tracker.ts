/** Content script — tracks active time on each page and reports to background */

const domain = (() => {
  const h = window.location.hostname;
  return h.startsWith('www.') ? h.slice(4) : h;
})();

// Skip extension pages and empty domains
if (!domain || domain === '' || location.protocol === 'chrome-extension:') {
  // no-op
} else {
  let startTime: number | null = null;
  let accumulated = 0; // seconds

  function start() {
    if (startTime === null) {
      startTime = Date.now();
    }
  }

  function pause() {
    if (startTime !== null) {
      accumulated += (Date.now() - startTime) / 1000;
      startTime = null;
    }
  }

  function flush() {
    pause();
    if (accumulated > 0) {
      const toSend = Math.round(accumulated);
      accumulated = 0;
      chrome.runtime.sendMessage({ type: 'TRACK_TIME', domain, seconds: toSend }).catch(() => {});
    }
    start();
  }

  // Start tracking when page becomes visible
  if (document.visibilityState === 'visible') {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      start();
    } else {
      flush();
    }
  });

  window.addEventListener('focus', start);
  window.addEventListener('blur', pause);

  // Flush every 30 seconds
  setInterval(flush, 30_000);

  // Flush on page unload
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
}
