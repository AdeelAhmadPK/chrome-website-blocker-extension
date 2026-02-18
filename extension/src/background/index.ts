import type { BlockedItem, FocusModeConfig } from '../shared/types';
import { getStore, setStore, updateFocusMode, onStoreChange } from '../shared/storage/store';
import { isScheduleActive, todayString } from '../shared/utils';

// ─── Rule IDs ─────────────────────────────────────────────────────────────────
// We reserve IDs 1–4000 for dynamic block rules; 5000 is the whitelist catch-all
const WHITELIST_CATCHALL_ID = 5000;
const FOCUS_RULE_OFFSET = 10000; // session rules

// ─── Blocked page URL builder ─────────────────────────────────────────────────
function blockedPageUrl(domain: string, reason: string): string {
  const base = chrome.runtime.getURL('blocked.html');
  return `${base}?site=${encodeURIComponent(domain)}&reason=${reason}`;
}

// ─── Build DNR rules from storage ────────────────────────────────────────────
async function rebuildRules(): Promise<void> {
  const store = await getStore();
  const { blockedItems, settings, focusMode } = store;

  if (!settings.blockingEnabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: await getExistingRuleIds(),
      addRules: [],
    });
    return;
  }

  const rulesToAdd: chrome.declarativeNetRequest.Rule[] = [];
  const today = todayString();

  if (settings.whitelistMode) {
    // Allow only listed domains; block everything else
    rulesToAdd.push({
      id: WHITELIST_CATCHALL_ID,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { url: blockedPageUrl('this site', 'blocked') },
      },
      condition: {
        urlFilter: '*',
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    });

    let id = 1;
    for (const item of blockedItems) {
      rulesToAdd.push({
        id: id++,
        priority: 2,
        action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          requestDomains: [item.url],
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });
    }
  } else {
    // Block listed domains
    let id = 1;
    for (const item of blockedItems) {
      const isLimited =
        item.dailyLimitMinutes !== undefined &&
        item.screenTimeToday >= item.dailyLimitMinutes;

      // Check temporary allow bypass
      const now = Date.now();
      const isTempAllowed = item.temporaryAllowUntil !== undefined && item.temporaryAllowUntil > now;
      if (isTempAllowed) continue;

      const hasSchedule = !!item.schedule;
      const scheduleActive = hasSchedule && isScheduleActive(item.schedule!);

      // limitOnly items (added via Usage Limit page) should only block when the limit is exceeded
      // Regular blocked items: block always (if no schedule) or during schedule hours
      const shouldBlock = item.limitOnly
        ? isLimited
        : (!hasSchedule || scheduleActive || isLimited);
      if (!shouldBlock) continue;

      const reason = isLimited ? 'limit' : scheduleActive ? 'schedule' : 'blocked';

      if (item.type === 'keyword') {
        rulesToAdd.push({
          id: id++,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: { url: blockedPageUrl(item.url, reason) },
          },
          condition: {
            urlFilter: `*${item.url}*`,
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          },
        });
      } else {
        rulesToAdd.push({
          id: id++,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: { url: blockedPageUrl(item.url, reason) },
          },
          condition: {
            requestDomains: [item.url],
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          },
        });
      }
    }
  }

  // During Focus work phase: block all except whitelisted
  if (focusMode.isActive && focusMode.phase === 'work') {
    const sessionRules: chrome.declarativeNetRequest.Rule[] = [
      {
        id: FOCUS_RULE_OFFSET,
        priority: 3,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: blockedPageUrl('this site', 'focus') },
        },
        condition: {
          urlFilter: '*',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
      ...focusMode.whitelistedDomains.map((domain, i) => ({
        id: FOCUS_RULE_OFFSET + i + 1,
        priority: 4,
        action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          requestDomains: [domain],
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })),
    ];

    try {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: await getExistingSessionRuleIds(),
        addRules: sessionRules,
      });
    } catch (e) {
      console.error('Session rules error:', e);
    }
  } else {
    try {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: await getExistingSessionRuleIds(),
        addRules: [],
      });
    } catch (e) {
      // ignore
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: await getExistingRuleIds(),
    addRules: rulesToAdd,
  });
}

async function getExistingRuleIds(): Promise<number[]> {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return rules.map((r) => r.id);
}

async function getExistingSessionRuleIds(): Promise<number[]> {
  try {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    return rules.map((r) => r.id);
  } catch {
    return [];
  }
}

// ─── Schedule Alarms ─────────────────────────────────────────────────────────
async function rescheduleAlarms(): Promise<void> {
  // Clear old schedule alarms
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith('schedule_')) {
      chrome.alarms.clear(alarm.name);
    }
  }

  const store = await getStore();
  for (const item of store.blockedItems) {
    if (!item.schedule) continue;
    const { days, startTime, endTime } = item.schedule;
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      const dayName = dayNames[d.getDay()];
      if (!days.includes(dayName)) continue;

      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);

      const start = new Date(d);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(d);
      end.setHours(eh, em, 0, 0);

      if (start > now) {
        chrome.alarms.create(`schedule_start_${item.id}_${offset}`, {
          when: start.getTime(),
        });
      }
      if (end > now) {
        chrome.alarms.create(`schedule_end_${item.id}_${offset}`, {
          when: end.getTime(),
        });
      }
    }
  }
}

// ─── Daily Reset ─────────────────────────────────────────────────────────────
async function checkDailyReset(): Promise<void> {
  const today = todayString();
  const store = await getStore();
  if (store.lastDailyReset === today) return;

  const resetItems = store.blockedItems.map((item) => ({
    ...item,
    screenTimeToday: 0,
  }));
  await setStore({ blockedItems: resetItems, lastDailyReset: today });
  await rebuildRules();
}

// ─── Time Tracking ────────────────────────────────────────────────────────────
async function handleTrackTime(domain: string, seconds: number): Promise<void> {
  const store = await getStore();
  const minutesToAdd = seconds / 60;
  const today = todayString();

  // Update insights
  const insights = [...store.insights];
  const idx = insights.findIndex((e) => e.domain === domain && e.date === today);
  if (idx >= 0) {
    insights[idx] = {
      ...insights[idx],
      totalMinutes: insights[idx].totalMinutes + minutesToAdd,
      visitCount: insights[idx].visitCount + 1,
    };
  } else {
    insights.push({ domain, date: today, visitCount: 1, totalMinutes: minutesToAdd });
  }

  // Update blockedItem screenTimeToday
  const blockedItems = store.blockedItems.map((item) => {
    if (item.url === domain || item.url === `www.${domain}`) {
      return { ...item, screenTimeToday: (item.screenTimeToday ?? 0) + minutesToAdd };
    }
    return item;
  });

  await setStore({ insights, blockedItems });

  // Check if any limit has now been exceeded
  const limitHit = blockedItems.find(
    (item) =>
      item.dailyLimitMinutes !== undefined &&
      item.screenTimeToday >= item.dailyLimitMinutes &&
      item.url === domain
  );
  if (limitHit) {
    chrome.notifications.create(`limit_${domain}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Daily Limit Reached',
      message: `You've used your ${limitHit.dailyLimitMinutes} min limit for ${domain}. It's now blocked.`,
    });
    await rebuildRules();
  }

  // Check 80% warning
  const todayStr = todayString();
  for (const item of blockedItems) {
    if (
      item.url === domain &&
      item.dailyLimitMinutes !== undefined &&
      item.warningFiredAt !== todayStr &&
      item.screenTimeToday >= item.dailyLimitMinutes * 0.8 &&
      item.screenTimeToday < item.dailyLimitMinutes
    ) {
      const remaining = Math.round(item.dailyLimitMinutes - item.screenTimeToday);
      chrome.notifications.create(`warn_${domain}`, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⚠️ Almost at your limit',
        message: `Only ${remaining} min left for ${domain} today.`,
      });
      // Mark warning fired
      const updated = blockedItems.map((b) =>
        b.url === domain ? { ...b, warningFiredAt: todayStr } : b
      );
      await setStore({ blockedItems: updated });
      break;
    }
  }

  // Break reminder tracking
  const store2 = await getStore();
  const reminderMins = store2.settings.breakReminderMinutes ?? 30;
  if (reminderMins > 0) {
    const contStart = store2.continuousBrowsingStart ?? Date.now();
    const contMinutes = (Date.now() - contStart) / 60000;
    if (!store2.continuousBrowsingStart) {
      await setStore({ continuousBrowsingStart: Date.now() });
    } else if (contMinutes >= reminderMins) {
      chrome.notifications.create('break_reminder', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '☕ Time for a break!',
        message: `You've been browsing for ${Math.round(contMinutes)} minutes. Take a short break.`,
      });
      await setStore({ continuousBrowsingStart: Date.now() });
    }
  }
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────
async function startFocus(): Promise<void> {
  const store = await getStore();
  const { focusMode } = store;
  const now = Date.now();
  const phaseEndsAt = now + focusMode.workMinutes * 60 * 1000;

  await updateFocusMode({
    isActive: true,
    phase: 'work',
    currentSession: 1,
    startedAt: now,
    phaseEndsAt,
  });

  chrome.alarms.create('focus_phase_end', { when: phaseEndsAt });
  chrome.alarms.create('focus_tick', { periodInMinutes: 1 / 60 }); // every second ≈ every minute

  await rebuildRules();
  broadcastFocusState();

  if (store.settings.showNotifications) {
    chrome.notifications.create('focus_start', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Session Started',
      message: `${focusMode.workMinutes} min work session. Stay focused!`,
    });
  }
}

async function stopFocus(): Promise<void> {
  await updateFocusMode({ isActive: false, phase: 'idle', currentSession: 1 });
  chrome.alarms.clear('focus_phase_end');
  chrome.alarms.clear('focus_tick');
  await rebuildRules();
  broadcastFocusState();
}

async function handleFocusPhaseEnd(): Promise<void> {
  const store = await getStore();
  const { focusMode } = store;

  if (!focusMode.isActive) return;

  if (focusMode.phase === 'work') {
    const now = Date.now();
    const phaseEndsAt = now + focusMode.breakMinutes * 60 * 1000;
    await updateFocusMode({ phase: 'break', phaseEndsAt, startedAt: now });
    chrome.alarms.create('focus_phase_end', { when: phaseEndsAt });

    chrome.notifications.create('focus_break', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Break Time!',
      message: `Session ${focusMode.currentSession} complete. Take a ${focusMode.breakMinutes} min break.`,
    });
  } else if (focusMode.phase === 'break') {
    const nextSession = focusMode.currentSession + 1;
    if (nextSession > focusMode.totalSessions) {
      await stopFocus();
      chrome.notifications.create('focus_done', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Focus Session Complete!',
        message: `All ${focusMode.totalSessions} sessions done. Great work!`,
      });
      return;
    }
    const now = Date.now();
    const phaseEndsAt = now + focusMode.workMinutes * 60 * 1000;
    await updateFocusMode({ phase: 'work', currentSession: nextSession, phaseEndsAt, startedAt: now });
    chrome.alarms.create('focus_phase_end', { when: phaseEndsAt });

    chrome.notifications.create(`focus_work_${nextSession}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Back to Work',
      message: `Session ${nextSession} of ${focusMode.totalSessions}. Focus!`,
    });
  }

  await rebuildRules();
  broadcastFocusState();
}

function broadcastFocusState(): void {
  getStore().then((store) => {
    chrome.runtime.sendMessage({
      type: 'FOCUS_STATE_UPDATE',
      state: store.focusMode,
    }).catch(() => {/* no listeners */});
  });
}

// ─── Daily Summary ────────────────────────────────────────────────────────────
async function sendDailySummary(): Promise<void> {
  const store = await getStore();
  const today = todayString();
  if (!store.settings.dailySummaryEnabled || store.lastDailySummary === today) return;

  const todayInsights = store.insights.filter((e) => e.date === today);
  if (todayInsights.length === 0) return;

  const totalMins = Math.round(todayInsights.reduce((s, e) => s + e.totalMinutes, 0));
  const topSite = todayInsights.sort((a, b) => b.totalMinutes - a.totalMinutes)[0];
  const blockedCount = store.blockedItems.filter((b) =>
    b.dailyLimitMinutes !== undefined && b.screenTimeToday >= b.dailyLimitMinutes
  ).length;

  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  chrome.notifications.create('daily_summary', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '📊 Your Daily Summary',
    message: `Total browsing: ${timeStr}. Top site: ${topSite?.domain ?? 'none'}. Limits hit: ${blockedCount}.`,
  });

  await setStore({ lastDailySummary: today });
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  await checkDailyReset();
  await rebuildRules();
  await rescheduleAlarms();

  // Daily reset alarm at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  chrome.alarms.create('daily_reset', { when: tomorrow.getTime(), periodInMinutes: 24 * 60 });

  // Daily summary alarm at 9 PM
  const summaryTime = new Date();
  summaryTime.setHours(21, 0, 0, 0);
  if (summaryTime <= new Date()) summaryTime.setDate(summaryTime.getDate() + 1);
  chrome.alarms.create('daily_summary', { when: summaryTime.getTime(), periodInMinutes: 24 * 60 });
});

chrome.runtime.onStartup.addListener(async () => {
  await checkDailyReset();
  await rebuildRules();
  await rescheduleAlarms();

  // Reset continuous browsing on browser start
  await setStore({ continuousBrowsingStart: Date.now() });

  // Re-schedule summary alarm if missing
  const existing = await chrome.alarms.get('daily_summary');
  if (!existing) {
    const summaryTime = new Date();
    summaryTime.setHours(21, 0, 0, 0);
    if (summaryTime <= new Date()) summaryTime.setDate(summaryTime.getDate() + 1);
    chrome.alarms.create('daily_summary', { when: summaryTime.getTime(), periodInMinutes: 24 * 60 });
  }
});

chrome.storage.local.onChanged.addListener((changes) => {
  if ('blockedItems' in changes || 'settings' in changes || 'focusMode' in changes) {
    rebuildRules();
    if ('blockedItems' in changes) rescheduleAlarms();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily_reset') {
    await checkDailyReset();
  } else if (alarm.name === 'daily_summary') {
    await sendDailySummary();
  } else if (alarm.name.startsWith('schedule_')) {
    await rebuildRules();
  } else if (alarm.name === 'focus_phase_end') {
    await handleFocusPhaseEnd();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRACK_TIME') {
    handleTrackTime(message.domain, message.seconds);
    sendResponse({ ok: true });
  } else if (message.type === 'START_FOCUS') {
    startFocus().then(() => sendResponse({ ok: true }));
    return true;
  } else if (message.type === 'STOP_FOCUS') {
    stopFocus().then(() => sendResponse({ ok: true }));
    return true;
  } else if (message.type === 'GET_FOCUS_STATE') {
    getStore().then((s) => sendResponse({ state: s.focusMode }));
    return true;
  } else if (message.type === 'REBUILD_RULES') {
    rebuildRules().then(() => sendResponse({ ok: true }));
    return true;
  } else if (message.type === 'TEMPORARY_ALLOW') {
    const { domain, minutes } = message;
    getStore().then(async (s) => {
      const until = Date.now() + minutes * 60 * 1000;
      const updated = s.blockedItems.map((b) =>
        b.url === domain ? { ...b, temporaryAllowUntil: until } : b
      );
      await setStore({ blockedItems: updated });
      await rebuildRules();
      sendResponse({ ok: true });
    });
    return true;
  }
});
