import { describe, it, expect } from 'vitest';
import { loadCategories, loadPhrases, validatePhrase } from '../lib/content/loadContent';

describe('content loader', () => {
  it('loads categories with required fields', () => {
    const cats = loadCategories();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.id).toBeTruthy();
      expect(c.nameEn).toBeTruthy();
    }
  });

  it('every phrase references a real category and has a valid gachi level', () => {
    const cats = new Set(loadCategories().map((c) => c.id));
    const phrases = loadPhrases();
    expect(phrases.length).toBeGreaterThan(0);
    for (const p of phrases) {
      expect(cats.has(p.categoryId)).toBe(true);
      expect(['wakeru', 'itai', 'tsuujiru']).toContain(p.tag.gachi);
    }
  });

  it('validatePhrase rejects a phrase missing meaningEn', () => {
    expect(() => validatePhrase({ id: 'x', categoryId: 'gyaru', term: 'a' } as any)).toThrow();
  });
});
