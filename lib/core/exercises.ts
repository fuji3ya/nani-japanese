import { GachiLevel, GACHI_EN, Phrase } from '../content/types';

export type ExerciseType = 'meaning' | 'reverse' | 'reading' | 'cloze' | 'cringe' | 'vibe';

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
}
export interface Exercise {
  type: ExerciseType;
  phraseId: string;
  instruction: string;
  prompt: string; // main displayed text (term, meaning, or cloze sentence)
  choices: Choice[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  return [...arr].sort(() => rng() - 0.5);
}

/** Pick up to n distractor phrases differing from `phrase` on the given field. */
function distractorPhrases(
  phrase: Phrase,
  pool: Phrase[],
  field: (p: Phrase) => string | undefined,
  n: number,
  rng: () => number,
): Phrase[] {
  const target = field(phrase);
  const seen = new Set<string>([String(target)]);
  const out: Phrase[] = [];
  for (const p of shuffle(pool, rng)) {
    if (p.id === phrase.id) continue;
    const v = field(p);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

function maskCloze(exampleJa: string, term: string): string {
  return exampleJa.includes(term) ? exampleJa.split(term).join('____') : `____ … (${exampleJa})`;
}

/**
 * Build an exercise of the given type, or null if the phrase/pool can't support it
 * (e.g. reading needs romaji, cloze needs the term to appear in the example).
 */
export function buildExercise(
  type: ExerciseType,
  phrase: Phrase,
  pool: Phrase[],
  rng: () => number = Math.random,
): Exercise | null {
  switch (type) {
    case 'meaning': {
      const d = distractorPhrases(phrase, pool, (p) => p.meaningEn, 3, rng);
      if (d.length < 1) return null;
      const choices = shuffle(
        [
          { id: phrase.id, text: phrase.meaningEn, correct: true },
          ...d.map((p) => ({ id: p.id, text: p.meaningEn, correct: false })),
        ],
        rng,
      );
      return { type, phraseId: phrase.id, instruction: 'What does it mean?', prompt: phrase.term, choices };
    }
    case 'reverse': {
      const d = distractorPhrases(phrase, pool, (p) => p.term, 3, rng);
      if (d.length < 1) return null;
      const choices = shuffle(
        [
          { id: phrase.id, text: phrase.term, correct: true },
          ...d.map((p) => ({ id: p.id, text: p.term, correct: false })),
        ],
        rng,
      );
      return { type, phraseId: phrase.id, instruction: 'Which word means this?', prompt: phrase.meaningEn, choices };
    }
    case 'reading': {
      if (!phrase.romaji) return null;
      const d = distractorPhrases(phrase, pool, (p) => p.romaji, 3, rng);
      if (d.length < 1) return null;
      const choices = shuffle(
        [
          { id: phrase.id, text: phrase.romaji, correct: true },
          ...d.map((p) => ({ id: p.id, text: p.romaji as string, correct: false })),
        ],
        rng,
      );
      return { type, phraseId: phrase.id, instruction: 'How do you read it?', prompt: phrase.term, choices };
    }
    case 'cloze': {
      if (!phrase.exampleJa.includes(phrase.term)) return null;
      const d = distractorPhrases(phrase, pool, (p) => p.term, 3, rng);
      if (d.length < 1) return null;
      const choices = shuffle(
        [
          { id: phrase.id, text: phrase.term, correct: true },
          ...d.map((p) => ({ id: p.id, text: p.term, correct: false })),
        ],
        rng,
      );
      return {
        type,
        phraseId: phrase.id,
        instruction: 'Fill the blank',
        prompt: maskCloze(phrase.exampleJa, phrase.term),
        choices,
      };
    }
    case 'cringe': {
      const levels: GachiLevel[] = ['wakeru', 'itai', 'tsuujiru'];
      const choices = levels.map((g) => ({ id: g, text: GACHI_EN[g], correct: g === phrase.tag.gachi }));
      return {
        type,
        phraseId: phrase.id,
        instruction: 'If you say this today, you sound…',
        prompt: phrase.term,
        choices,
      };
    }
    case 'vibe': {
      const who = (p: Phrase) => p.tag.whoUsesEn ?? p.tag.whoUses;
      const d = distractorPhrases(phrase, pool, who, 3, rng);
      if (d.length < 1) return null;
      const choices = shuffle(
        [
          { id: phrase.id, text: who(phrase), correct: true },
          ...d.map((p) => ({ id: p.id, text: who(p), correct: false })),
        ],
        rng,
      );
      return { type, phraseId: phrase.id, instruction: 'Who actually says this?', prompt: phrase.term, choices };
    }
  }
}

export function checkExercise(ex: Exercise, choiceId: string): boolean {
  return ex.choices.find((c) => c.id === choiceId)?.correct === true;
}

/** Preference order of exercise types by mastery box (easy → hard). */
export function preferredTypes(box: number): ExerciseType[] {
  if (box <= 1) return ['meaning', 'reading', 'cloze'];
  if (box === 2) return ['reading', 'cloze', 'meaning'];
  if (box === 3) return ['cloze', 'cringe', 'meaning'];
  if (box === 4) return ['reverse', 'vibe', 'cloze', 'meaning'];
  return ['vibe', 'reverse', 'cringe', 'meaning'];
}

/** Choose the hardest buildable exercise appropriate to the box; always falls back to meaning. */
export function buildBestExercise(
  phrase: Phrase,
  pool: Phrase[],
  box: number,
  rng: () => number = Math.random,
): Exercise | null {
  for (const t of preferredTypes(box)) {
    const ex = buildExercise(t, phrase, pool, rng);
    if (ex) return ex;
  }
  return buildExercise('meaning', phrase, pool, rng);
}
