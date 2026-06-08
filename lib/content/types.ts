export type GachiLevel = 'wakeru' | 'itai' | 'tsuujiru'; // ウケる / イタい / 通じる
export type Tier = 'free' | 'pro';

export interface TemperatureTag {
  era: string; // "平成ギャル" | "令和" | "江戸" ...
  eraEn?: string; // English label for EN-first chrome ("Edo era", "Reiwa")
  whoUses: string; // "JK" | "オタク" | "関西の人" ...
  whoUsesEn?: string; // English label ("Edo locals / artisans")
  gachi: GachiLevel; // what happens if you use it today
  sourceNote?: string; // internal accuracy trace (DESIGN §6)
}

export interface Phrase {
  id: string;
  categoryId: string;
  term: string; // "あげぽよ"
  reading?: string; // kana reading
  romaji?: string; // pronunciation helper for EN audience (e.g. "nan-de-ya-nen")
  meaningEn: string;
  meaningJa: string;
  exampleJa: string;
  /** Romaji reading of the example sentence (pronunciation aid for EN audience). */
  exampleRomaji?: string;
  exampleEn: string;
  /** Code-switched English example that drops the word in (e.g. "You can't sleep here — akan de!"). */
  exampleMix?: string;
  /** Dramatized "what happens if you use this today" — brand-voice copy (D/Reveal). */
  socialConsequenceEn?: string;
  tag: TemperatureTag;
}

/** Visual theme tokens per category — drives the per-category look. */
export interface Category {
  id: string; // "gyaru"
  nameJa: string; // "ギャル語"
  nameEn: string; // "Gyaru slang"
  emoji: string; // motif emoji
  blurbEn: string;
  tier: Tier; // 'free' | 'pro' (pro = paywall-locked)
  accent: string; // strong theme color (CTA / hero)
  tileBg: string; // pastel tile background
  kwShadow: string; // keyword hard-shadow color
  peek: string; // sample headword shown on the home tile (JP, original script)
}

/** English labels for the gachi (usability-now) level — English-first chrome. */
export const GACHI_EN: Record<GachiLevel, string> = {
  wakeru: 'Hilarious 😂',
  itai: 'Cringe now 😬',
  tsuujiru: 'Still works 👍',
};
