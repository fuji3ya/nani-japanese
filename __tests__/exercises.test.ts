import { describe, it, expect } from 'vitest';
import {
  buildExercise,
  checkExercise,
  preferredTypes,
  buildBestExercise,
} from '../lib/core/exercises';
import { Phrase } from '../lib/content/types';

const mk = (id: string, over: Partial<Phrase> = {}): Phrase => ({
  id,
  categoryId: 'k',
  term: `${id}語`,
  reading: id,
  romaji: `${id}-yo`,
  meaningEn: `mean-${id}`,
  meaningJa: 'm',
  exampleJa: `これは${id}語だ`,
  exampleEn: 'e',
  tag: { era: 'x', whoUses: `who-${id}`, gachi: 'itai' },
  ...over,
});

const pool = [mk('a'), mk('b'), mk('c'), mk('d')];
const zero = () => 0;

describe('buildExercise', () => {
  it('meaning: 4 choices incl. correct meaning', () => {
    const ex = buildExercise('meaning', pool[0], pool, zero)!;
    expect(ex.type).toBe('meaning');
    expect(ex.choices).toHaveLength(4);
    expect(ex.choices.find((c) => c.correct)!.text).toBe('mean-a');
    expect(ex.prompt).toBe('a語');
  });

  it('reverse: prompt is meaning, choices are terms', () => {
    const ex = buildExercise('reverse', pool[0], pool, zero)!;
    expect(ex.prompt).toBe('mean-a');
    expect(ex.choices.find((c) => c.correct)!.text).toBe('a語');
  });

  it('reading: needs romaji; null when missing', () => {
    const ex = buildExercise('reading', pool[0], pool, zero)!;
    expect(ex.choices.find((c) => c.correct)!.text).toBe('a-yo');
    const noRomaji = buildExercise('reading', mk('z', { romaji: undefined }), pool, zero);
    expect(noRomaji).toBeNull();
  });

  it('cloze: blanks the term in the example; null when term absent', () => {
    const ex = buildExercise('cloze', pool[0], pool, zero)!;
    expect(ex.prompt).toContain('____');
    expect(ex.prompt).not.toContain('a語');
    const noTerm = buildExercise('cloze', mk('w', { exampleJa: 'no term here' }), pool, zero);
    expect(noTerm).toBeNull();
  });

  it('cringe: 3 gachi choices, correct matches tag.gachi', () => {
    const ex = buildExercise('cringe', pool[0], pool, zero)!;
    expect(ex.choices).toHaveLength(3);
    const correct = ex.choices.find((c) => c.correct)!;
    expect(correct.id).toBe('itai');
    expect(checkExercise(ex, 'itai')).toBe(true);
    expect(checkExercise(ex, 'tsuujiru')).toBe(false);
  });

  it('vibe: choices are whoUses', () => {
    const ex = buildExercise('vibe', pool[0], pool, zero)!;
    expect(ex.choices.find((c) => c.correct)!.text).toBe('who-a');
  });
});

describe('difficulty selection', () => {
  it('preferredTypes escalates with box', () => {
    expect(preferredTypes(0)[0]).toBe('meaning');
    expect(preferredTypes(5)[0]).toBe('vibe');
  });

  it('buildBestExercise falls back to a buildable type', () => {
    // box5 prefers vibe; pool supports it
    expect(buildBestExercise(pool[0], pool, 5, zero)!.type).toBe('vibe');
    // tiny pool (no distractors) still yields something or null gracefully
    const ex = buildBestExercise(pool[0], [pool[0]], 0, zero);
    expect(ex === null || ex.type === 'cringe').toBe(true);
  });
});
