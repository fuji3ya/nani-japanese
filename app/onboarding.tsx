import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { loadCategories } from '../lib/content/loadContent';
import { loadProgress, saveProgress, completeOnboarding, Progress } from '../store/progress';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const ACCENT = '#FF4D6D';

const REASONS = ['Anime & manga', 'I have Japanese friends', 'Visiting Japan', 'I just love weird words'];
const LEVELS = ['Total zero', 'I know こんにちは', 'I can survive', 'Pretty good already'];
const GOALS = [
  { n: 1, label: 'Chill · 1 word/day' },
  { n: 3, label: 'Steady · 3 words/day' },
  { n: 5, label: 'Sweaty · 5 words/day' },
];

export default function Onboarding() {
  const router = useRouter();
  const [base, setBase] = useState<Progress | null>(null);
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<string>();
  const [level, setLevel] = useState<string>();
  const [interest, setInterest] = useState<string>();
  const [goal, setGoal] = useState(3);

  useEffect(() => {
    loadProgress().then(setBase);
  }, []);

  const freeCats = loadCategories().filter((c) => c.tier === 'free');
  const interestCat = freeCats.find((c) => c.id === interest);
  const next = () => setStep((s) => s + 1);

  const finish = async () => {
    if (!base) return;
    const np = completeOnboarding(base, { goal, interest });
    await saveProgress(np);
    router.replace('/');
  };

  const TOTAL = 6;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 24, paddingBottom: 40, minHeight: '100%' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* progress dots */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 24 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: i <= step ? ACCENT : '#ECE8DC' }} />
        ))}
      </View>

      {step === 0 && (
        <Step
          emoji="👀"
          title="The Japanese textbooks are too scared to teach."
          sub="Gyaru, Kansai, Edo, net slang — the words that make you sound like a real (weird) human."
          cta="Let's go →"
          onCta={next}
        />
      )}

      {step === 1 && (
        <Question
          q="Why are you here?"
          options={REASONS}
          selected={reason}
          onPick={(v) => {
            setReason(v);
            next();
          }}
        />
      )}

      {step === 2 && (
        <Question
          q="How's your Japanese?"
          options={LEVELS}
          selected={level}
          onPick={(v) => {
            setLevel(v);
            next();
          }}
        />
      )}

      {step === 3 && (
        <Question
          q="Which vibe first?"
          options={freeCats.map((c) => `${c.emoji} ${c.nameEn}  ·  ${c.peek}`)}
          selected={interest ? `${interestCat?.emoji} ${interestCat?.nameEn}  ·  ${interestCat?.peek}` : undefined}
          onPick={(_, i) => {
            setInterest(freeCats[i].id);
            next();
          }}
        />
      )}

      {step === 4 && (
        <Question
          q="Pick a daily goal"
          options={GOALS.map((g) => g.label)}
          selected={GOALS.find((g) => g.n === goal)?.label}
          onPick={(_, i) => {
            setGoal(GOALS[i].n);
            next();
          }}
        />
      )}

      {step === 5 && (
        <Step
          emoji="✅"
          title="Every word is real."
          sub="Checked against actual sources & native usage — with era, who-says-it, and a cringe rating. No AI gibberish, no fake slang. You'll never embarrass yourself."
          cta="Continue →"
          onCta={next}
        />
      )}

      {step === 6 && (
        <View>
          <Text style={{ fontWeight: '900', fontSize: 22, color: INK }}>You're all set 🎉</Text>
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderWidth: 3, borderColor: INK, borderRadius: 18, padding: 18, boxShadow: '6px 6px 0px #15130F' }}>
            <Recap label="Here for" value={reason ?? '—'} />
            <Recap label="Level" value={level ?? '—'} />
            <Recap label="Starting with" value={interestCat ? `${interestCat.emoji} ${interestCat.nameEn}` : 'Anything'} />
            <Recap label="Daily goal" value={`${goal} words/day`} />
          </View>
          <Pressable
            onPress={finish}
            style={{ marginTop: 24, backgroundColor: ACCENT, borderWidth: 3, borderColor: INK, borderRadius: 16, padding: 16, alignItems: 'center', boxShadow: '5px 5px 0px #15130F' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>Start learning</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function Step({ emoji, title, sub, cta, onCta }: { emoji: string; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <View>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={{ fontWeight: '900', fontSize: 26, color: INK, marginTop: 16, lineHeight: 32 }}>{title}</Text>
      <Text style={{ fontWeight: '600', fontSize: 15, color: '#6a6557', marginTop: 12, lineHeight: 22 }}>{sub}</Text>
      <Pressable
        onPress={onCta}
        style={{ marginTop: 28, backgroundColor: ACCENT, borderWidth: 3, borderColor: INK, borderRadius: 16, padding: 16, alignItems: 'center', boxShadow: '5px 5px 0px #15130F' }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{cta}</Text>
      </Pressable>
    </View>
  );
}

function Question({
  q,
  options,
  selected,
  onPick,
}: {
  q: string;
  options: string[];
  selected?: string;
  onPick: (value: string, index: number) => void;
}) {
  return (
    <View>
      <Text style={{ fontWeight: '900', fontSize: 24, color: INK, marginBottom: 18 }}>{q}</Text>
      {options.map((o, i) => (
        <Pressable
          key={o}
          onPress={() => onPick(o, i)}
          style={{
            padding: 16,
            borderRadius: 14,
            borderWidth: 2.5,
            borderColor: INK,
            backgroundColor: selected === o ? ACCENT : '#fff',
            marginBottom: 12,
            boxShadow: '3px 3px 0px #15130F',
          }}
        >
          <Text style={{ fontWeight: '800', fontSize: 16, color: selected === o ? '#fff' : INK }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }}>
      <Text style={{ fontWeight: '700', fontSize: 14, color: '#8a8475' }}>{label}</Text>
      <Text style={{ fontWeight: '900', fontSize: 14, color: INK }}>{value}</Text>
    </View>
  );
}
