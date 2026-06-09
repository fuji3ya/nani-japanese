import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakState } from '../lib/core/streak';
import { updateBox, WordProgress } from '../lib/core/srs';

const KEY = 'jpkotoba:progress:v2';
// `pro` lives in its OWN key, NOT inside the progress blob. Two independent
// writers touch entitlement (RC reconcile on launch/foreground) and learning
// data (the lesson screen). Sharing one serialized blob caused a last-writer-
// wins lost-update; separate keys mean neither writer can clobber the other.
const PRO_KEY = 'jpkotoba:pro';
// The free daily new-word quota ALSO lives in its own key (same reasoning as
// PRO_KEY): the lesson screen writes the whole progress blob from two handlers,
// which raced and lost a quota increment — letting a free user exceed the cap.
const QUOTA_KEY = 'jpkotoba:quota';

export const FREE_DAILY_NEW = 5; // free users: new words learned per day

export interface Progress {
  seenByCategory: Record<string, string[]>; // categoryId -> phrase ids
  words: Record<string, WordProgress>; // phraseId -> SRS box/nextDue
  streak: StreakState | null;
  pro: boolean; // unlocked everything
  onboarded: boolean; // finished first-run onboarding
  goal: number; // daily new-word goal (1/3/5) — consumed by buildSession
  interest?: string; // chosen starter pack id — consumed by Home (word-of-the-day)
}

const EMPTY: Progress = {
  seenByCategory: {},
  words: {},
  streak: null,
  pro: false,
  onboarded: false,
  goal: 3,
};

export function completeOnboarding(
  p: Progress,
  a: { goal: number; interest?: string },
): Progress {
  // `reason` / `level` are asked during onboarding for engagement and to seed the
  // default goal, but are intentionally NOT persisted (nothing reads them back —
  // keeping them out avoids a dead stored field).
  return { ...p, onboarded: true, goal: a.goal, interest: a.interest };
}

async function readQuota(): Promise<{ day: string | null; count: number }> {
  try {
    const raw = await AsyncStorage.getItem(QUOTA_KEY);
    const q = raw ? JSON.parse(raw) : null;
    if (q && typeof q === 'object' && typeof q.count === 'number') return { day: q.day ?? null, count: q.count };
  } catch {
    /* fall through */
  }
  return { day: null, count: 0 };
}

/** New words already spent toward today's free quota (0 on a new day). */
export async function getQuotaUsed(today: string): Promise<number> {
  const q = await readQuota();
  return q.day === today ? q.count : 0;
}

/** Pure: remaining free new words given pro + used count (Infinity if Pro). */
export function freeNewRemainingFor(pro: boolean, used: number): number {
  return pro ? Infinity : Math.max(0, FREE_DAILY_NEW - used);
}

/** Atomically spend one free new word toward today's quota (own key, race-free). */
export async function bumpNewLearn(today: string): Promise<void> {
  const q = await readQuota();
  const used = q.day === today ? q.count : 0;
  await AsyncStorage.setItem(QUOTA_KEY, JSON.stringify({ day: today, count: used + 1 }));
}

/** Persist the entitlement flag to its OWN key (source of truth, separate from the progress blob). */
export async function persistPro(pro: boolean): Promise<void> {
  await AsyncStorage.setItem(PRO_KEY, pro ? '1' : '0');
}

export async function loadProgress(): Promise<Progress> {
  // `pro` is read from its own key and always overrides whatever a stale blob holds.
  const pro = (await AsyncStorage.getItem(PRO_KEY)) === '1';
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...EMPTY, pro };
  try {
    const parsed = JSON.parse(raw);
    const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
    // Validate the index-accessed maps: a corrupted (null/array/string) value
    // would otherwise crash on p.seenByCategory[id] / p.words[id].
    return {
      ...EMPTY,
      ...parsed,
      pro, // PRO_KEY wins over the blob's (ignored) pro field
      seenByCategory: isObj(parsed.seenByCategory) ? parsed.seenByCategory : {},
      words: isObj(parsed.words) ? parsed.words : {},
    };
  } catch {
    return { ...EMPTY, pro };
  }
}

/** Persist learning data. Never the source of truth for `pro` (see persistPro). */
export async function saveProgress(p: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

/**
 * User-initiated data control (App Store 5.1.1(v)): wipe all learning data
 * (words/SRS, streak, seen, daily counters) while preserving the unlock state
 * (`pro`, reconciled from RevenueCat anyway) and the finished-onboarding flag.
 */
export async function resetProgress(): Promise<Progress> {
  const p = await loadProgress();
  const cleared: Progress = { ...EMPTY, pro: p.pro, onboarded: p.onboarded, goal: p.goal, interest: p.interest };
  await saveProgress(cleared);
  await AsyncStorage.removeItem(QUOTA_KEY); // also reset today's free-word counter
  return cleared;
}

export function markSeen(p: Progress, categoryId: string, phraseId: string): Progress {
  const seen = new Set(p.seenByCategory[categoryId] ?? []);
  seen.add(phraseId);
  return { ...p, seenByCategory: { ...p.seenByCategory, [categoryId]: [...seen] } };
}

/** Record a practice/review answer: advance or reset the word's SRS box. */
export function markAnswered(
  p: Progress,
  phraseId: string,
  correct: boolean,
  today: string,
): Progress {
  const next = updateBox(p.words[phraseId] ?? null, correct, today);
  return { ...p, words: { ...p.words, [phraseId]: next } };
}

export function boxOf(p: Progress, phraseId: string): number {
  return p.words[phraseId]?.box ?? 0;
}
