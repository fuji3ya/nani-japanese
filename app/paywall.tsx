import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { loadProgress, saveProgress, setPro, Progress } from '../store/progress';
import { FONT } from '../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const ACCENT = '#FF4D6D';
const MUTE = '#8a8475';

const PRO_PERKS = [
  ['🔓', 'All 8 packs', 'Adds Heian elegant + Okinawa'],
  ['∞', 'Unlimited new words', 'No 5-a-day limit'],
  ['🔁', 'SRS review on every pack', 'Spaced-repetition across all of them'],
  ['📖', 'Fill your whole collection', 'Every word, every pack'],
  ['🔊', 'Audio & native voices', 'Coming soon'],
];

export default function Paywall() {
  const router = useRouter();
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => {
    loadProgress().then(setP);
  }, []);

  const goPro = async () => {
    if (!p) return;
    // NOTE: real purchase = App Store IAP (StoreKit/RevenueCat) — wired in the device phase.
    const np = setPro(p, true);
    await saveProgress(np);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 24, paddingBottom: 44 }}>
      <Stack.Screen options={{ title: 'Go Pro', headerBackTitle: 'Back' }} />

      <Text style={{ fontSize: 44, textAlign: 'center', marginTop: 4 }}>🔓</Text>
      <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 26, color: INK, textAlign: 'center', marginTop: 6 }}>
        Unlock all of Nani?!
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 14, color: MUTE, textAlign: 'center', marginTop: 6 }}>
        Every era, every region, no limits.
      </Text>

      {/* What you already get free — so the line is obvious */}
      <View
        style={{
          marginTop: 20,
          backgroundColor: '#F1EEE4',
          borderWidth: 2,
          borderColor: '#d8d3c4',
          borderRadius: 16,
          padding: 14,
        }}
      >
        <Text style={{ fontWeight: '900', fontSize: 12, color: MUTE, letterSpacing: 1 }}>YOU'RE ON FREE</Text>
        <Text style={{ fontWeight: '700', fontSize: 14, color: INK, marginTop: 5 }}>
          ✓ 6 packs · ✓ 5 new words a day · ✓ review what you've learned
        </Text>
        <Text style={{ fontWeight: '700', fontSize: 13, color: MUTE, marginTop: 4 }}>
          Free stays free. Pro just removes the limits ↓
        </Text>
      </View>

      {/* Pro card */}
      <View
        style={{
          marginTop: 16,
          backgroundColor: '#fff',
          borderWidth: 3,
          borderColor: INK,
          borderRadius: 20,
          padding: 18,
          boxShadow: '6px 6px 0px #15130F',
        }}
      >
        <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 18, color: INK, marginBottom: 8 }}>
          With Pro you get
        </Text>
        {PRO_PERKS.map(([icon, title, sub]) => (
          <View key={title} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 }}>
            <Text style={{ fontSize: 17, width: 28 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: INK }}>{title}</Text>
              <Text style={{ fontWeight: '600', fontSize: 12, color: MUTE, marginTop: 1 }}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Price */}
      <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 20, color: INK, textAlign: 'center', marginTop: 22 }}>
        $4.99 / month
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: MUTE, textAlign: 'center', marginTop: 2 }}>
        or $39.99 / year (save 33%)
      </Text>

      {/* Trial mechanics — exactly what happens */}
      <View
        style={{
          marginTop: 16,
          backgroundColor: '#EAF1FF',
          borderWidth: 2,
          borderColor: '#3B82F6',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text style={{ fontWeight: '800', fontSize: 13, color: INK, lineHeight: 19 }}>
          ▸ Days 1–7: full Pro, free.{'\n'}
          ▸ Cancel before day 7 → you pay $0 and keep Free.{'\n'}
          ▸ Don't cancel → $4.99/mo starts on day 8.
        </Text>
      </View>

      <Pressable
        onPress={goPro}
        style={{
          marginTop: 16,
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
        <Text style={{ fontWeight: '800', fontSize: 14, color: MUTE }}>Keep using Free</Text>
      </Pressable>

      <Text style={{ fontSize: 11, color: '#b8b2a3', textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
        Auto-renews until cancelled. Manage or cancel anytime in Settings. (Demo build — no real charge.)
      </Text>
    </ScrollView>
  );
}
