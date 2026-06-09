import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { persistPro } from '../store/progress';
import { getPlanPrices, purchasePlan, restorePurchases } from '../lib/purchases';
import { FONT } from '../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const ACCENT = '#FF4D6D';
const MUTE = '#8a8475';
const TERMS_URL = 'https://nani-japanese-legal.pages.dev/terms';
const PRIVACY_URL = 'https://nani-japanese-legal.pages.dev/privacy';

const PRO_PERKS = [
  ['🔓', 'All 8 packs', 'Adds Otaku, Heian & Okinawa'],
  ['∞', 'Unlimited new words', 'No 5-a-day limit'],
  ['🔁', 'SRS review on every pack', 'Spaced-repetition across all of them'],
  ['📖', 'Fill your whole collection', 'Every word, every pack'],
];

export default function Paywall() {
  const router = useRouter();
  const [prices, setPrices] = useState({ monthly: '$4.99 / month', annual: '$39.99 / year' });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    getPlanPrices().then((v) => on && setPrices(v)).catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const finishPro = async () => {
    await persistPro(true);
    router.back();
  };

  const buy = async (plan: 'monthly' | 'annual') => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const ok = await purchasePlan(plan);
      if (ok) await finishPro();
      else setNote('Purchase not completed.');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const ok = await restorePurchases();
      if (ok) await finishPro();
      else setNote('No previous purchases found.');
    } finally {
      setBusy(false);
    }
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

      {/* What you already get free */}
      <View style={{ marginTop: 20, backgroundColor: '#F1EEE4', borderWidth: 2, borderColor: '#d8d3c4', borderRadius: 16, padding: 14 }}>
        <Text style={{ fontWeight: '900', fontSize: 12, color: MUTE, letterSpacing: 1 }}>YOU'RE ON FREE</Text>
        <Text style={{ fontWeight: '700', fontSize: 14, color: INK, marginTop: 5 }}>
          ✓ 5 packs · ✓ 5 new words a day · ✓ review what you've learned
        </Text>
        <Text style={{ fontWeight: '700', fontSize: 13, color: MUTE, marginTop: 4 }}>
          Free stays free. Pro just removes the limits ↓
        </Text>
      </View>

      {/* Pro card */}
      <View style={{ marginTop: 16, backgroundColor: '#fff', borderWidth: 3, borderColor: INK, borderRadius: 20, padding: 18, boxShadow: '6px 6px 0px #15130F' }}>
        <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 18, color: INK, marginBottom: 8 }}>With Pro you get</Text>
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

      {/* Annual — primary */}
      <Pressable
        onPress={() => buy('annual')}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Go Pro yearly, ${prices.annual}`}
        accessibilityState={{ disabled: busy, busy }}
        style={{ marginTop: 22, backgroundColor: ACCENT, borderWidth: 3, borderColor: INK, borderRadius: 16, padding: 15, alignItems: 'center', boxShadow: '5px 5px 0px #15130F', opacity: busy ? 0.6 : 1 }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{busy ? 'Processing…' : `Go Pro — ${prices.annual}`}</Text>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, marginTop: 2, opacity: 0.92 }}>Best value · save 33%</Text>
      </Pressable>

      {/* Monthly — secondary */}
      <Pressable
        onPress={() => buy('monthly')}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Go Pro monthly, ${prices.monthly}`}
        accessibilityState={{ disabled: busy, busy }}
        style={{ marginTop: 10, backgroundColor: '#fff', borderWidth: 3, borderColor: INK, borderRadius: 16, padding: 14, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
      >
        <Text style={{ color: INK, fontWeight: '900', fontSize: 15 }}>{prices.monthly}</Text>
      </Pressable>

      {!!note && (
        <Text style={{ textAlign: 'center', color: '#b3261e', fontWeight: '700', fontSize: 13, marginTop: 12 }}>{note}</Text>
      )}

      <Pressable
        onPress={doRestore}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Restore purchases"
        accessibilityState={{ disabled: busy, busy }}
        style={{ marginTop: 14, alignItems: 'center', padding: 8 }}
      >
        <Text style={{ fontWeight: '800', fontSize: 14, color: INK }}>Restore purchases</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} disabled={busy} style={{ marginTop: 2, alignItems: 'center', padding: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: MUTE }}>Keep using Free</Text>
      </Pressable>

      {/* Required subscription disclosure (App Store 3.1.2(a)) — names the product + both periods */}
      <Text style={{ fontSize: 11, color: '#b8b2a3', textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
        Nani?! Pro is an auto-renewing subscription: {prices.monthly} or {prices.annual}. Payment is charged to your
        Apple ID. It renews each period until cancelled; manage or cancel anytime in your Apple ID settings at least 24h
        before the period ends.
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8 }}>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={{ fontSize: 12, color: MUTE, fontWeight: '700', textDecorationLine: 'underline' }}>Terms</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={{ fontSize: 12, color: MUTE, fontWeight: '700', textDecorationLine: 'underline' }}>Privacy</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
