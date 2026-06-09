import { Redirect, useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { findCategory, loadPhrasesByCategory } from '../../lib/content/loadContent';
import { GACHI_EN, Phrase } from '../../lib/content/types';
import { FONT } from '../../lib/theme';
import { buildBestExercise, checkExercise, Exercise } from '../../lib/core/exercises';
import { isDue } from '../../lib/core/srs';
import { updateStreak } from '../../lib/core/streak';
import {
  loadProgress,
  saveProgress,
  markSeen,
  markAnswered,
  boxOf,
  getQuotaUsed,
  freeNewRemainingFor,
  bumpNewLearn,
  Progress,
} from '../../store/progress';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const DAILY_GOAL = 3;
// LOCAL calendar date (not UTC) so streak/daily-cap day boundaries match the
// user's wall clock — UTC slicing miscounts for JST users before 09:00.
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type Step = { kind: 'learn' | 'practice'; phrase: Phrase };

function buildSession(pool: Phrase[], progress: Progress, catId: string, today: string, quotaUsed: number): Step[] {
  const seen = new Set(progress.seenByCategory[catId] ?? []);
  const due = pool
    .filter((p) => seen.has(p.id) && progress.words[p.id] && isDue(progress.words[p.id], today))
    .slice(0, 5);
  const freshAllowed = Math.max(0, Math.min(progress.goal || DAILY_GOAL, freeNewRemainingFor(progress.pro, quotaUsed)));
  const fresh = pool.filter((p) => !seen.has(p.id)).slice(0, freshAllowed);
  const steps: Step[] = [];
  due.forEach((p) => steps.push({ kind: 'practice', phrase: p }));
  fresh.forEach((p) => {
    steps.push({ kind: 'learn', phrase: p });
    steps.push({ kind: 'practice', phrase: p });
  });
  return steps;
}

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cat = findCategory(id!);
  const pool = loadPhrasesByCategory(id!);
  const accent = cat?.accent ?? '#16C79A';

  const [progress, setProgress] = useState<Progress | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [ex, setEx] = useState<Exercise | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ learned: 0, reviewed: 0, correct: 0, practiced: 0 });
  const [streakDone, setStreakDone] = useState<number | null>(null);
  const [lastLearned, setLastLearned] = useState<Phrase | null>(null);
  // Re-entrancy latch for the learn-step "Got it" button: a fast double-tap
  // would otherwise burn two free new-words + skip the paired practice step.
  const advLock = useRef(false);
  const [quotaUsed, setQuotaUsed] = useState(0);
  // Capture the local day ONCE per lesson so a session straddling midnight is
  // accounted to a single day (no mid-session quota reset).
  const today = useMemo(() => todayISO(), []);

  // load + build session once
  useEffect(() => {
    (async () => {
      const p = await loadProgress();
      const used = await getQuotaUsed(today);
      setProgress(p);
      setQuotaUsed(used);
      setSteps(buildSession(pool, p, id!, today, used));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps && idx < steps.length ? steps[idx] : null;

  // build exercise when entering a practice step
  useEffect(() => {
    advLock.current = false; // new step → release the Got-it latch
    if (step?.kind === 'practice' && progress) {
      const e = buildBestExercise(step.phrase, pool, boxOf(progress, step.phrase.id));
      if (e) {
        setEx(e);
        setPicked(null);
      } else {
        // No buildable exercise (e.g. a pool too small for distractors) —
        // skip this step instead of leaving the user on a dead "…" screen.
        setEx(null);
        setIdx((i) => i + 1);
      }
    } else {
      setEx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, steps]);

  if (!progress || !steps || !cat) {
    return (
      <View style={{ flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: cat ? `${cat.emoji} ${cat.nameEn}` : '' }} />
        <Text>…</Text>
      </View>
    );
  }

  // Pro-pack guard: the Home grid gates navigation, but this screen must also
  // refuse a Pro pack reached any other way (deep link, back-stack, future web).
  if (cat.tier === 'pro' && !progress.pro) {
    return <Redirect href={'/paywall' as never} />;
  }

  // coming soon (no content)
  if (pool.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Stack.Screen options={{ title: `${cat.emoji} ${cat.nameEn}` }} />
        <Text style={{ fontSize: 48 }}>{cat.emoji}</Text>
        <Text style={{ fontWeight: '900', fontSize: 22, color: INK, marginTop: 12, textAlign: 'center' }}>
          {cat.nameEn} is coming soon
        </Text>
        <Text style={{ fontWeight: '600', fontSize: 14, color: '#8a8475', marginTop: 8, textAlign: 'center' }}>
          {cat.blurbEn}
        </Text>
        <Back accent={accent} onPress={() => router.back()} />
      </View>
    );
  }

  // session complete (or nothing due/new)
  if (!step) {
    const unseenExist = pool.some((ph) => !(progress.seenByCategory[id!] ?? []).includes(ph.id));
    const limited = steps.length === 0 && !progress.pro && freeNewRemainingFor(progress.pro, quotaUsed) === 0 && unseenExist;
    const allCaughtUp = steps.length === 0 && !limited;
    // Show the actual most-recently-learned word (captured in onGotIt), never a
    // merely-reviewed word and never just the first word of the batch.
    const cardPhrase = stats.learned > 0 ? lastLearned ?? undefined : undefined;
    const shareWord = () => {
      if (!cardPhrase) return;
      Share.share({
        message: `I just learned ${cardPhrase.term} (${cardPhrase.meaningEn}) — the Japanese they don't teach you. ${cardPhrase.socialConsequenceEn ?? ''} 🔓 Nani?! Japanese`,
      });
    };
    return (
      <View style={{ flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Stack.Screen options={{ title: `${cat.emoji} ${cat.nameEn}` }} />
        <Text style={{ fontSize: 52 }}>{limited ? '🔒' : allCaughtUp ? '✅' : '🎉'}</Text>
        <Text style={{ fontWeight: '900', fontSize: 24, color: INK, marginTop: 12, textAlign: 'center' }}>
          {limited ? "That's today's free batch!" : allCaughtUp ? "You're all caught up!" : 'Session complete!'}
        </Text>
        {limited && (
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#6a6557', marginTop: 10, textAlign: 'center' }}>
            Come back tomorrow — or go Pro for unlimited words.
          </Text>
        )}
        {allCaughtUp && (
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#6a6557', marginTop: 10, textAlign: 'center' }}>
            No new or due words right now.
          </Text>
        )}
        {!allCaughtUp && !limited && (
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#6a6557', marginTop: 10, textAlign: 'center' }}>
            Learned {stats.learned} · Reviewed {stats.reviewed} ·{' '}
            {stats.practiced ? Math.round((stats.correct / stats.practiced) * 100) : 0}% correct
          </Text>
        )}
        {streakDone != null && (
          <Text style={{ fontWeight: '900', fontSize: 18, color: INK, marginTop: 12 }}>🔥 {streakDone} day streak</Text>
        )}

        {!allCaughtUp && !limited && cardPhrase && (
          <>
            <View
              style={{
                marginTop: 20,
                width: '100%',
                backgroundColor: cat.tileBg,
                borderWidth: 3,
                borderColor: INK,
                borderRadius: 20,
                padding: 18,
                alignItems: 'center',
                boxShadow: '6px 6px 0px #15130F',
              }}
            >
              <Text style={{ fontWeight: '800', fontSize: 11, letterSpacing: 1, color: '#6a6557' }}>I JUST LEARNED</Text>
              <Text
                style={{
                  fontWeight: '900',
                  fontSize: 40,
                  color: INK,
                  marginTop: 6,
                  textShadowColor: cat.kwShadow,
                  textShadowOffset: { width: 4, height: 4 },
                  textShadowRadius: 0,
                }}
              >
                {cardPhrase.term}
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 13, color: INK, marginTop: 8, textAlign: 'center' }}>
                {cardPhrase.meaningEn}
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 11, color: '#6a6557', marginTop: 10 }}>Nani?! Japanese</Text>
            </View>
            <Pressable
              onPress={shareWord}
              style={{ marginTop: 14, backgroundColor: INK, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>📣 Share my word</Text>
            </Pressable>
          </>
        )}

        {limited && (
          <Pressable
            onPress={() => router.push('/paywall' as never)}
            style={{ marginTop: 22, backgroundColor: '#FF4D6D', borderWidth: 3, borderColor: INK, borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14, boxShadow: '4px 4px 0px #15130F' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>🔓 Go Pro — unlimited</Text>
          </Pressable>
        )}
        <Back accent={accent} onPress={() => router.back()} label="Done" />
      </View>
    );
  }

  const advance = () => setIdx((i) => i + 1);

  const finishIfLast = async (p: Progress) => {
    if (idx + 1 >= steps.length) {
      const s = updateStreak(p.streak, today);
      const np = { ...p, streak: s };
      setProgress(np);
      setStreakDone(s.count);
      await saveProgress(np);
    }
  };

  const onGotIt = async () => {
    if (advLock.current) return; // ignore double-tap until the next step renders
    advLock.current = true;
    const p = markSeen(progress, id!, step.phrase.id);
    setProgress(p);
    setLastLearned(step.phrase);
    setStats((s) => ({ ...s, learned: s.learned + 1 }));
    await bumpNewLearn(today); // atomic quota spend on its own key (race-free)
    setQuotaUsed((u) => u + 1);
    await saveProgress(p);
    await finishIfLast(p);
    advance();
  };

  const onPick = async (choiceId: string) => {
    if (picked || !ex) return;
    const correct = checkExercise(ex, choiceId);
    setPicked(choiceId);
    const wasSeenBefore = (progress.words[step.phrase.id]?.box ?? 0) > 0;
    const p = markAnswered(progress, step.phrase.id, correct, today);
    setProgress(p);
    setStats((s) => ({
      ...s,
      practiced: s.practiced + 1,
      correct: s.correct + (correct ? 1 : 0),
      reviewed: s.reviewed + (wasSeenBefore ? 1 : 0),
    }));
    await saveProgress(p);
    await finishIfLast(p);
  };

  const progressPct = Math.round((idx / steps.length) * 100);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: `${cat.emoji} ${cat.nameEn}`, headerBackTitle: 'Back' }} />

      {/* progress bar */}
      <View style={{ height: 8, backgroundColor: '#ECE8DC', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
        <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: accent }} />
      </View>

      {step.kind === 'learn' ? (
        <Reveal phrase={step.phrase} accent={accent} kwShadow={cat.kwShadow} onNext={onGotIt} />
      ) : ex ? (
        <Practice
          phrase={step.phrase}
          ex={ex}
          accent={accent}
          picked={picked}
          onPick={onPick}
          onNext={advance}
        />
      ) : (
        <Text>…</Text>
      )}
    </ScrollView>
  );
}

function Reveal({
  phrase,
  accent,
  kwShadow,
  onNext,
}: {
  phrase: Phrase;
  accent: string;
  kwShadow: string;
  onNext: () => void;
}) {
  return (
    <View>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: accent,
            borderWidth: 2,
            borderColor: INK,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 10, letterSpacing: 1.5, color: '#fff' }}>NEW WORD</Text>
        </View>
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text
          style={{
            fontFamily: FONT.heavy,
            fontWeight: '900',
            fontSize: 58,
            color: INK,
            textAlign: 'center',
            textShadowColor: kwShadow,
            textShadowOffset: { width: 5, height: 5 },
            textShadowRadius: 0,
          }}
        >
          {phrase.term}
        </Text>
        {!!phrase.romaji && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: '#fff',
              borderWidth: 2.5,
              borderColor: INK,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 5,
              transform: [{ rotate: '-2deg' }],
              boxShadow: '3px 3px 0px #15130F',
            }}
          >
            <Text style={{ fontWeight: '800', fontSize: 15, letterSpacing: 1, color: INK }}>{phrase.romaji}</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', paddingBottom: 8 }}>
        <Tag>🕰 {phrase.tag.eraEn ?? phrase.tag.era}</Tag>
        <Tag>🗣 {phrase.tag.whoUsesEn ?? phrase.tag.whoUses}</Tag>
        <Tag hot accent={accent}>{GACHI_EN[phrase.tag.gachi]}</Tag>
      </View>

      <Card>
        <Text style={{ fontWeight: '900', fontSize: 10, letterSpacing: 1.5, color: '#b8b2a3' }}>MEANING</Text>
        <Text style={{ fontWeight: '900', fontSize: 22, color: INK, marginTop: 5, lineHeight: 28 }}>{phrase.meaningEn}</Text>
        {!!phrase.socialConsequenceEn && (
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#a8662b', marginTop: 12, lineHeight: 20 }}>
            👉 {phrase.socialConsequenceEn}
          </Text>
        )}
        <View style={{ marginTop: 14, borderTopWidth: 2, borderColor: '#e7e3d6', borderStyle: 'dashed', paddingTop: 13 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: INK }}>{phrase.exampleJa}</Text>
          {!!phrase.exampleRomaji && (
            <Text style={{ fontWeight: '600', fontSize: 12, color: accent, marginTop: 2 }}>{phrase.exampleRomaji}</Text>
          )}
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#8a8475', marginTop: 3 }}>
            {phrase.exampleMix ?? phrase.exampleEn}
          </Text>
        </View>
      </Card>

      <Btn accent={accent} label="Got it →" onPress={onNext} />
    </View>
  );
}

function Practice({
  phrase,
  ex,
  accent,
  picked,
  onPick,
  onNext,
}: {
  phrase: Phrase;
  ex: Exercise;
  accent: string;
  picked: string | null;
  onPick: (id: string) => void;
  onNext: () => void;
}) {
  const answered = picked != null;
  const wasCorrect = answered && ex.choices.find((c) => c.id === picked)?.correct === true;
  return (
    <View>
      <Text style={{ fontWeight: '900', fontSize: 14, color: INK, marginBottom: 6 }}>{ex.instruction}</Text>
      <Card>
        <Text style={{ fontWeight: '900', fontSize: ex.type === 'cloze' ? 20 : 34, color: INK, lineHeight: 40 }}>
          {ex.prompt}
        </Text>
      </Card>

      <View style={{ height: 12 }} />
      {ex.choices.map((c) => {
        const show = answered;
        const bg = !show
          ? '#F2F2F7'
          : c.correct
            ? '#DCFCE7'
            : c.id === picked
              ? '#FEE2E2'
              : '#F2F2F7';
        return (
          <Pressable
            key={c.id}
            onPress={() => onPick(c.id)}
            style={{ padding: 16, borderRadius: 12, backgroundColor: bg, marginBottom: 10, borderWidth: 2, borderColor: INK }}
          >
            <Text style={{ fontWeight: '700', color: INK }}>{c.text}</Text>
          </Pressable>
        );
      })}

      {answered && (
        <View style={{ marginTop: 6 }}>
          {/* non-punitive: re-teach on wrong */}
          <Text style={{ fontWeight: '900', fontSize: 16, color: wasCorrect ? '#16794f' : '#b3261e' }}>
            {wasCorrect ? 'Nice! 😀' : 'Not quite — here it is 👇'}
          </Text>
          {!wasCorrect && (
            <Card>
              <Text style={{ fontWeight: '900', fontSize: 18, color: INK }}>
                {phrase.term} — {phrase.meaningEn}
              </Text>
              {!!phrase.socialConsequenceEn && (
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#a8662b', marginTop: 8 }}>
                  👉 {phrase.socialConsequenceEn}
                </Text>
              )}
            </Card>
          )}
          <Btn accent={accent} label="Continue →" onPress={onNext} />
        </View>
      )}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: INK,
        borderRadius: 20,
        padding: 18,
        boxShadow: '6px 6px 0px #15130F',
      }}
    >
      {children}
    </View>
  );
}

function Btn({ accent, label, onPress }: { accent: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginTop: 20,
        backgroundColor: accent,
        borderWidth: 3,
        borderColor: INK,
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        boxShadow: '5px 5px 0px #15130F',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>{label}</Text>
    </Pressable>
  );
}

function Back({ accent, onPress, label = '← Back' }: { accent: string; onPress: () => void; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginTop: 24,
        backgroundColor: accent,
        borderWidth: 3,
        borderColor: INK,
        borderRadius: 16,
        paddingHorizontal: 22,
        paddingVertical: 14,
        boxShadow: '4px 4px 0px #15130F',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

function Tag({ children, hot, accent }: { children: React.ReactNode; hot?: boolean; accent?: string }) {
  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: INK,
        borderRadius: 11,
        paddingHorizontal: 11,
        paddingVertical: 6,
        backgroundColor: hot ? (accent ?? '#16C79A') : '#fff',
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 11, color: hot ? '#fff' : INK }}>{children}</Text>
    </View>
  );
}
