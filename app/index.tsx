import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { findCategory, loadCategories, loadPhrasesByCategory } from '../lib/content/loadContent';
import { getQuotaUsed, loadProgress, resetProgress, Progress } from '../store/progress';
import { FONT } from '../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';

// LOCAL calendar date — must match the lesson screen's day boundary.
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [todayLearned, setTodayLearned] = useState(0);

  // Reload on every focus (incl. returning from a lesson) so 🔥 streak / unlock
  // state reflect what just happened — a mount-only effect would stay stale.
  useFocusEffect(
    useCallback(() => {
      loadProgress().then((p) => {
        if (!p.onboarded) router.replace('/onboarding' as never);
        else setProgress(p);
      });
      getQuotaUsed(todayISO()).then(setTodayLearned);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const cats = loadCategories();

  if (!progress) {
    return <View style={{ flex: 1, backgroundColor: PAPER }} />;
  }

  const isPro = progress.pro;
  const unlocked = isPro ? cats.length : cats.filter((c) => c.tier === 'free').length;

  const onReset = () => {
    Alert.alert(
      'Reset all progress?',
      'This clears your learned words, streak, and collection. Your Pro unlock is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const p = await resetProgress();
            setProgress(p);
          },
        },
      ],
    );
  };

  // Word of the day — featured from the user's chosen starter pack (falls back to Kansai).
  const startId =
    progress.interest && loadPhrasesByCategory(progress.interest).length ? progress.interest : 'kansai';
  const startCat = findCategory(startId) ?? findCategory('kansai')!;
  // Word of the day: rotate once per day (deterministic, advances daily).
  const wodPool = loadPhrasesByCategory(startId);
  // Local-day index so the word-of-the-day flips at local midnight, matching the
  // streak / daily-cap local-date boundary (not UTC).
  const _now = new Date();
  const dayIdx = Math.floor((_now.getTime() - _now.getTimezoneOffset() * 60_000) / 86_400_000);
  const featured = wodPool.length ? wodPool[dayIdx % wodPool.length] : undefined;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ paddingBottom: 28 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 24,
          paddingBottom: 8,
        }}
      >
        <View>
          <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 23, color: INK }}>
            Nani<Text style={{ color: '#FF4D6D' }}>?!</Text> Japanese<Text style={{ color: '#FF4D6D' }}>!!</Text>
          </Text>
          <Text style={{ fontWeight: '700', fontSize: 11, color: '#9a9484', marginTop: 5 }}>
            Weird Japanese · the Japanese they don't teach you
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View
            accessibilityLabel={`Today: ${Math.min(todayLearned, progress.goal || 3)} of ${progress.goal || 3} new words`}
            style={{
              borderWidth: 2.5,
              borderColor: INK,
              borderRadius: 999,
              paddingHorizontal: 11,
              paddingVertical: 7,
              backgroundColor: todayLearned >= (progress.goal || 3) ? '#DCFCE7' : '#fff',
              boxShadow: '3px 3px 0px #15130F',
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 14, color: INK }}>
              {todayLearned >= (progress.goal || 3) ? '✅' : '🎯'} {Math.min(todayLearned, progress.goal || 3)}/
              {progress.goal || 3}
            </Text>
          </View>
          <View
            accessibilityLabel={`${progress.streak?.count ?? 0} day streak`}
            style={{
              borderWidth: 2.5,
              borderColor: INK,
              borderRadius: 999,
              paddingHorizontal: 11,
              paddingVertical: 7,
              backgroundColor: '#fff',
              boxShadow: '3px 3px 0px #15130F',
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 14, color: INK }}>🔥 {progress.streak?.count ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* word of the day (from chosen starter pack) */}
      {featured && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Word of the day: ${featured.term} — ${featured.meaningEn}`}
          onPress={() => router.push(`/category/${startId}`)}
          style={{
            marginHorizontal: 18,
            marginTop: 14,
            marginBottom: 6,
            borderWidth: 3,
            borderColor: INK,
            borderRadius: 22,
            backgroundColor: startCat.tileBg,
            padding: 18,
            boxShadow: '6px 6px 0px #15130F',
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 11, letterSpacing: 1, color: INK, opacity: 0.6 }}>
            WORD OF THE DAY · {startCat.nameEn.toUpperCase()}
          </Text>
          <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 38, color: INK, marginTop: 4 }}>
            {featured.term}
          </Text>
          <Text style={{ fontWeight: '800', fontSize: 13, color: INK, marginTop: 6 }}>{featured.meaningEn}</Text>
        </Pressable>
      )}

      {/* collection */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open your collection"
        onPress={() => router.push('/dex' as never)}
        style={{
          marginHorizontal: 18,
          marginTop: 12,
          borderWidth: 3,
          borderColor: INK,
          borderRadius: 16,
          backgroundColor: '#fff',
          padding: 13,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '4px 4px 0px #15130F',
        }}
      >
        <Text style={{ fontWeight: '900', fontSize: 15, color: INK }}>📖 Your collection</Text>
        <Text style={{ fontWeight: '900', fontSize: 15, color: INK }}>→</Text>
      </Pressable>

      {/* section */}
      <Text style={{ fontWeight: '900', fontSize: 13, color: INK, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 8 }}>
        Pick a vibe{'  '}
        <Text style={{ color: '#b8b2a3', fontWeight: '800', fontSize: 11 }}>
          · {unlocked} of {cats.length} packs
        </Text>
      </Text>

      {/* grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 18 }}>
        {cats.map((c) => {
          const locked = c.tier === 'pro' && !isPro;
          const poolN = loadPhrasesByCategory(c.id).length;
          const gotN = (progress.seenByCategory?.[c.id] ?? []).length;
          const pct = poolN ? Math.min(100, Math.round((gotN / poolN) * 100)) : 0;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.nameEn} pack${locked ? ', locked — Pro' : `, ${gotN} of ${poolN} words learned`}`}
              onPress={() => (locked ? router.push('/paywall' as never) : router.push(`/category/${c.id}`))}
              style={({ pressed }) => ({
                width: '48%',
                minHeight: 126,
                borderWidth: 3,
                borderColor: INK,
                borderRadius: 20,
                backgroundColor: c.tileBg,
                padding: 13,
                justifyContent: 'space-between',
                boxShadow: pressed ? '1px 1px 0px #15130F' : '4px 4px 0px #15130F',
                transform: [{ translateX: pressed ? 3 : 0 }, { translateY: pressed ? 3 : 0 }],
                opacity: locked ? 0.55 : 1,
              })}
            >
              <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
              <View>
                <Text style={{ fontWeight: '900', fontSize: 15, color: INK, marginTop: 6 }}>{c.nameEn}</Text>
                <Text style={{ fontWeight: '700', fontSize: 11, color: INK, opacity: 0.62 }}>{c.nameJa}</Text>
              </View>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: locked ? '#9a9484' : INK,
                  borderRadius: 8,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  marginTop: 9,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                  {locked ? '🔒 Pro' : c.peek}
                </Text>
              </View>
              {/* pack progress — the collection drive, visible on the main surface */}
              {!locked && gotN > 0 && (
                <View style={{ marginTop: 9 }}>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: '#ffffff',
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: INK,
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent }} />
                  </View>
                  <Text style={{ fontWeight: '800', fontSize: 10, color: INK, opacity: 0.65, marginTop: 3 }}>
                    {gotN}/{poolN}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {isPro ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage subscription"
          onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {})}
          style={{ paddingTop: 18, paddingBottom: 4 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 12, color: '#8a8475' }}>
            ✨ Pro · all packs unlocked · Manage subscription
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock all packs with Pro"
          onPress={() => router.push('/paywall' as never)}
          style={{ paddingTop: 18, paddingBottom: 4 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 12, color: '#8a8475' }}>
            🔒 Unlock all packs with Pro →
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset all progress"
        onPress={onReset}
        style={{ paddingTop: 10, paddingBottom: 8 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 11, color: '#c2bdae' }}>Reset all progress</Text>
      </Pressable>
    </ScrollView>
  );
}
