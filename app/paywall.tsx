import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { loadProgress, saveProgress, setPro, Progress } from '../store/progress';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const ACCENT = '#FF4D6D';

const PERKS = [
  '🔓 All 8 packs (incl. Heian & Okinawa)',
  '∞ Unlimited new words per day',
  '🔁 SRS review across every pack',
  '📖 Fill your whole collection',
  '🔊 Audio & native voices (coming soon)',
];

export default function Paywall() {
  const router = useRouter();
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => {
    loadProgress().then(setP);
  }, []);

  const goPro = async () => {
    if (!p) return;
    // NOTE: real purchase = App Store IAP (StoreKit/RevenueCat) — wired in the CI/device phase.
    const np = setPro(p, true);
    await saveProgress(np);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: 'Go Pro', headerBackTitle: 'Back' }} />

      <Text style={{ fontSize: 46, textAlign: 'center', marginTop: 8 }}>🔓</Text>
      <Text style={{ fontWeight: '900', fontSize: 26, color: INK, textAlign: 'center', marginTop: 6 }}>
        Unlock all of Nani?!
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 14, color: '#8a8475', textAlign: 'center', marginTop: 6 }}>
        Every era, every region, no limits.
      </Text>

      <View
        style={{
          marginTop: 22,
          backgroundColor: '#fff',
          borderWidth: 3,
          borderColor: INK,
          borderRadius: 20,
          padding: 18,
          boxShadow: '6px 6px 0px #15130F',
        }}
      >
        {PERKS.map((perk) => (
          <Text key={perk} style={{ fontWeight: '700', fontSize: 15, color: INK, marginVertical: 6 }}>
            {perk}
          </Text>
        ))}
      </View>

      <Text style={{ fontWeight: '900', fontSize: 18, color: INK, textAlign: 'center', marginTop: 22 }}>
        $4.99 / month
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: '#8a8475', textAlign: 'center', marginTop: 2 }}>
        or $39.99 / year (save 33%)
      </Text>

      <Pressable
        onPress={goPro}
        style={{
          marginTop: 18,
          backgroundColor: ACCENT,
          borderWidth: 3,
          borderColor: INK,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          boxShadow: '5px 5px 0px #15130F',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>Start 7-day free trial</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ marginTop: 14, alignItems: 'center', padding: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: '#8a8475' }}>Maybe later</Text>
      </Pressable>

      <Text style={{ fontSize: 11, color: '#b8b2a3', textAlign: 'center', marginTop: 14, lineHeight: 16 }}>
        Auto-renews. Cancel anytime in Settings. (Demo build — no real charge.)
      </Text>
    </ScrollView>
  );
}
