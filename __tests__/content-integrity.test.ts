import { describe, it, expect } from 'vitest';
import { loadCategories, loadPhrasesByCategory } from '../lib/content/loadContent';

// Guards the 388-word content set against the regressions found in the 5-round
// audit: cross-pack duplicate terms, and phrases missing their injected
// exampleMix / eraEn / whoUsesEn (which would render as undefined in the app).

const cats = loadCategories();
const all = cats.flatMap((c) => loadPhrasesByCategory(c.id));

describe('content integrity', () => {
  it('has the expected packs and a healthy word count', () => {
    expect(cats.length).toBe(8);
    expect(all.length).toBeGreaterThan(350);
  });

  it('no duplicate term appears in more than one pack', () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const p of all) {
      const prev = seen.get(p.term);
      if (prev && prev !== p.categoryId) dups.push(`${p.term} (${prev} & ${p.categoryId})`);
      else seen.set(p.term, p.categoryId);
    }
    expect(dups).toEqual([]);
  });

  it('no duplicate ids', () => {
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every phrase has required fields and a valid gachi', () => {
    const bad: string[] = [];
    for (const p of all) {
      if (!p.term || !p.meaningEn || !p.exampleJa || !p.romaji) bad.push(`${p.id}: missing field`);
      if (!['wakeru', 'itai', 'tsuujiru'].includes(p.tag.gachi)) bad.push(`${p.id}: bad gachi`);
      if (p.categoryId !== cats.find((c) => c.id === p.categoryId)?.id) bad.push(`${p.id}: bad cat`);
    }
    expect(bad).toEqual([]);
  });

  it('loader injects exampleMix + English era/who labels on every phrase', () => {
    const missing: string[] = [];
    for (const p of all) {
      if (!p.exampleMix) missing.push(`${p.id}: no exampleMix`);
      if (!p.tag.eraEn) missing.push(`${p.id}: no eraEn`);
      if (!p.tag.whoUsesEn) missing.push(`${p.id}: no whoUsesEn`);
    }
    expect(missing).toEqual([]);
  });
});
