import { describe, it, expect } from 'vitest';
import { updateBox, isDue, dueWordIds, isMastered, WordProgress } from '../lib/core/srs';

const TODAY = '2026-06-07';

describe('srs updateBox', () => {
  it('new + correct → box1, due tomorrow', () => {
    expect(updateBox(null, true, TODAY)).toEqual({ box: 1, nextDue: '2026-06-08' });
  });

  it('box1 + correct → box2, due +3 days', () => {
    expect(updateBox({ box: 1, nextDue: TODAY }, true, TODAY)).toEqual({ box: 2, nextDue: '2026-06-10' });
  });

  it('wrong resets to box0, due tomorrow', () => {
    expect(updateBox({ box: 4, nextDue: TODAY }, false, TODAY)).toEqual({ box: 0, nextDue: '2026-06-08' });
  });

  it('caps at box5 (mastered), due +35 days', () => {
    expect(updateBox({ box: 5, nextDue: TODAY }, true, TODAY)).toEqual({ box: 5, nextDue: '2026-07-12' });
  });
});

describe('srs scheduling', () => {
  const words: Record<string, WordProgress> = {
    a: { box: 2, nextDue: '2026-06-06' }, // due (past)
    b: { box: 1, nextDue: '2026-06-07' }, // due (today)
    c: { box: 3, nextDue: '2026-06-20' }, // not due
  };

  it('isDue compares dates', () => {
    expect(isDue(words.a, TODAY)).toBe(true);
    expect(isDue(words.c, TODAY)).toBe(false);
  });

  it('dueWordIds returns only due words', () => {
    expect(dueWordIds(words, TODAY).sort()).toEqual(['a', 'b']);
  });

  it('isMastered at box5', () => {
    expect(isMastered({ box: 5, nextDue: TODAY })).toBe(true);
    expect(isMastered({ box: 4, nextDue: TODAY })).toBe(false);
    expect(isMastered(undefined)).toBe(false);
  });
});
