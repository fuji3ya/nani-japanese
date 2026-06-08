import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakState } from '../lib/core/streak';
import { updateBox, WordProgress } from '../lib/core/srs';

const KEY = 'jpkotoba:progress:v2';

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
  reason?: string; // why-here answer — persisted from onboarding
  level?: string; // self-rated JP level — persisted; seeds the default goal
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
  a: { goal: number; interest?: string; reason?: string; level?: string },
): Progress {
  return { ...p, onboarded: true, goal: a.goal, interest: a.interest, reason: a.reason, level: a.level };
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

export function setPro(p: Progress, pro: boolean): Progress {
  return { ...p, pro };
}

export async function loadProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
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
