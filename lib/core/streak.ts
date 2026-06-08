export interface StreakState {
  count: number;
  lastDay: string; // 'YYYY-MM-DD'
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z');
  return Math.round(ms / 86_400_000);
}

export function updateStreak(prev: StreakState | null, today: string): StreakState {
  if (!prev) return { count: 1, lastDay: today };
  const gap = daysBetween(prev.lastDay, today);
  if (gap === 0) return prev;
  if (gap === 1) return { count: prev.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}
