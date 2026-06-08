import { describe, it, expect } from 'vitest';
import { updateStreak, StreakState } from '../lib/core/streak';

describe('updateStreak', () => {
  const base: StreakState = { count: 3, lastDay: '2026-06-05' };

  it('increments on the next consecutive day', () => {
    expect(updateStreak(base, '2026-06-06')).toEqual({ count: 4, lastDay: '2026-06-06' });
  });

  it('is a no-op when called twice on the same day', () => {
    expect(updateStreak(base, '2026-06-05')).toEqual({ count: 3, lastDay: '2026-06-05' });
  });

  it('resets to 1 after a gap', () => {
    expect(updateStreak(base, '2026-06-08')).toEqual({ count: 1, lastDay: '2026-06-08' });
  });

  it('starts at 1 from an empty state', () => {
    expect(updateStreak(null, '2026-06-06')).toEqual({ count: 1, lastDay: '2026-06-06' });
  });
});
