import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakState } from '../lib/core/streak';
import { updateBox, WordProgress } from '../lib/core/srs';

const KEY = 'jpkotoba:progress:v2';
// `pro` lives in its OWN key, NOT inside the progress blob. Two independent
// writers touch entitlement (RC reconcile on launch/foreground) and learning
// data (the lesson screen). Sharing one serialized blob caused a last-writer-
// wins lost-update; separate keys mean neither writer can clobber the other.
const PRO_KEY = 'jpkotoba:pro';

export const FREE_DAILY_NEW = 5; // free users: new words learned per day

export interface Progress {
  seenByCategory: Record<string, string[]>; // categoryId -> phrase ids
  words: Record<string, WordProgress>; // phraseId -> SRS box/nextDue
  streak: StreakState | null;
  pro: boolean; // unlocked everything
  newDay: string | null; // 'YYYY-MM-DD' for the new-word daily counter
  newToday: number; // new words learned today (free gating)
  onboarded: boolean; // finished first-run onboarding
  goal: number; // daily new-word goal (1/3/5) — consumed by buildSession
  interest?: string; // chosen starter pack id — consumed by Home (word-of-the-day)
}

const EMPTY: Progress = {
  seenByCategory: {},
  words: {},
  streak: null,
  pro: false,
  newDay: null,
  newToday: 0,
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

/** New words still allowed today for free users (Infinity if Pro). */
export function freeNewRemaining(p: Progress, today: string): number {
  if (p.pro) return Infinity;
  const used = p.newDay === today ? p.newToday : 0;
  return Math.max(0, FREE_DAILY_NEW - used);
}

/** Count one new word toward today's free quota. */
export function bumpNewLearn(p: Progress, today: string): Progress {
  const used = p.newDay === today ? p.newToday : 0;
  return { ...p, newDay: today, newToday: used + 1 };
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
