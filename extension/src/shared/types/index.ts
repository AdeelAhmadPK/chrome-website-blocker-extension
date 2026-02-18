// ─── Day / Time ─────────────────────────────────────────────────────────────
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  days: DayOfWeek[];
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
}

// ─── Blocked Item ─────────────────────────────────────────────────────────────
export type BlockedItemType = 'domain' | 'keyword' | 'category';

export interface BlockedItem {
  id: string;
  url: string;
  type: BlockedItemType;
  favicon?: string;
  schedule?: Schedule;
  dailyLimitMinutes?: number;   // undefined = no limit
  limitOnly?: boolean;          // true = only block when daily limit is exceeded (not always blocked)
  screenTimeToday: number;      // minutes, resets at midnight
  temporaryAllowUntil?: number; // timestamp ms — bypass active until this time
  warningFiredAt?: string;      // date string — 80% warning already sent for this day
  createdAt: number;            // Unix timestamp ms
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface BlockCategory {
  id: string;
  name: string;
  icon: string;
  domains: string[];
}

// ─── Insights ─────────────────────────────────────────────────────────────────
export interface InsightEntry {
  domain: string;
  date: string;        // "YYYY-MM-DD"
  visitCount: number;
  totalMinutes: number;
  category?: string;
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────
export type FocusPhase = 'work' | 'break' | 'idle';

export interface FocusModeConfig {
  workMinutes: number;
  breakMinutes: number;
  totalSessions: number;
  currentSession: number;
  isActive: boolean;
  phase: FocusPhase;
  startedAt?: number;           // timestamp ms
  phaseEndsAt?: number;         // timestamp ms
  whitelistedDomains: string[];
}

// ─── Password ─────────────────────────────────────────────────────────────────
export interface PasswordConfig {
  enabled: boolean;
  hash: string;                 // SHA-256 hex, empty if not set
  failedAttempts: number;
  lockedUntil?: number;         // timestamp ms
}

// ─── Custom Block Page ────────────────────────────────────────────────────────
export type BlockPageMode =
  | 'default'
  | 'motivational'
  | 'minimalist'
  | 'meme'
  | 'redirect'
  | 'custom';

export interface CustomBlockPageConfig {
  mode: BlockPageMode;
  message?: string;
  backgroundColor?: string;
  imageBase64?: string;
  redirectUrl?: string;
  redirectDelay?: number;       // seconds
}

// ─── App Settings ────────────────────────────────────────────────────────────
export interface AppSettings {
  blockingEnabled: boolean;
  whitelistMode: boolean;       // block everything EXCEPT listed
  theme: 'light' | 'dark';
  showNotifications: boolean;
  dismissedSuggestions: string[];
  breakReminderMinutes?: number; // 0 = disabled, e.g. 30 = remind after 30 mins continuous browsing
  dailySummaryEnabled?: boolean;
}

// ─── Root Storage ─────────────────────────────────────────────────────────────
export interface AppStorage {
  blockedItems: BlockedItem[];
  insights: InsightEntry[];
  focusMode: FocusModeConfig;
  password: PasswordConfig;
  customBlockPage: CustomBlockPageConfig;
  settings: AppSettings;
  lastDailyReset: string;       // "YYYY-MM-DD"
  onboardingCompleted?: boolean;
  continuousBrowsingStart?: number; // timestamp ms — when current browsing session started
  lastDailySummary?: string;   // "YYYY-MM-DD" — last date a summary was sent
}

// ─── Message Types ────────────────────────────────────────────────────────────
export type MessageType =
  | 'TRACK_TIME'
  | 'START_FOCUS'
  | 'STOP_FOCUS'
  | 'FOCUS_STATE_UPDATE'
  | 'REBUILD_RULES'
  | 'GET_FOCUS_STATE';

export interface TrackTimeMessage {
  type: 'TRACK_TIME';
  domain: string;
  seconds: number;
}

export interface StartFocusMessage {
  type: 'START_FOCUS';
}

export interface StopFocusMessage {
  type: 'STOP_FOCUS';
}

export interface FocusStateUpdateMessage {
  type: 'FOCUS_STATE_UPDATE';
  state: FocusModeConfig;
}

export interface GetFocusStateMessage {
  type: 'GET_FOCUS_STATE';
}

export type ExtensionMessage =
  | TrackTimeMessage
  | StartFocusMessage
  | StopFocusMessage
  | FocusStateUpdateMessage
  | GetFocusStateMessage;
