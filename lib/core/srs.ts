// Spaced-repetition (Leitner / SM-2-lite). Pure functions, no native imports.

export interface WordProgress {
  box: number; // 0 (new/lapsed) .. 5 (mastered)
  nextDue: string; // 'YYYY-MM-DD'
}

export const MAX_BOX = 5;
// Days until next review, indexed by box. box0 → tomorrow, ... box5 → 35 days.
export const INTERVALS = [1, 1, 3, 7, 16, 35];

function addDays(day: string, n: number): string {
  const ms = Date.parse(day + 'T00:00:00Z') + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Advance on correct (box+1, capped), reset to 0 on wrong; reschedule nextDue. */
export function updateBox(prev: WordProgress | null, correct: boolean, today: string): WordProgress {
  const box = prev?.box ?? 0;
  const next = correct ? Math.min(box + 1, MAX_BOX) : 0;
  return { box: next, nextDue: addDays(today, INTERVALS[next]) };
}

export function isDue(wp: WordProgress, today: string): boolean {
  return wp.nextDue <= today;
}

export function dueWordIds(words: Record<string, WordProgress>, today: string): string[] {
  return Object.keys(words).filter((id) => isDue(words[id], today));
}

export function isMastered(wp: WordProgress | undefined): boolean {
  return (wp?.box ?? 0) >= MAX_BOX;
}
