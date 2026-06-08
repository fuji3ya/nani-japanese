import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { findCategory, loadCategories, loadPhrasesByCategory } from '../lib/content/loadContent';
import { loadProgress, saveProgress, setPro, Progress } from '../store/progress';
import { FONT } from '../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);

  // Reload on every focus (incl. returning from a lesson) so 🔥 streak / unlock
  // state reflect what just happened — a mount-only effect would stay stale.
  useFocusEffect(
    useCallback(() => {
      loadProgress().then((p) => {
        if (!p.onboarded) router.replace('/onboarding' as never);
        else setProgress(p);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const cats = loadCategories();

  if (!progress) {
    return <View style={{ flex: 1, backgroundColor: PAPER }} />;
  }

  const isPro = progress.pro;
  const unlocked = isPro ? cats.length : cats.filter((c) => c.tier === 'free').length;

  // Demo only: flip Pro off so the locked/free state can be re-tested.
  // (Replaced by real Restore Purchases when StoreKit/RevenueCat is wired.)
  const resetProDemo = async () => {
    const np = setPro(progress, false);
    await saveProgress(np);
    setProgress(np);
  };

  // Word of the day — featured from the user's chosen starter pack (falls back to Kansai).
  const startId =
    progress.interest && loadPhrasesByCategory(progress.interest).length ? progress.interest : 'kansai';
  const startCat = findCategory(startId) ?? findCategory('kansai')!;
  // Word of the day: rotate once per day (deterministic, advances daily).
  const wodPool = loadPhrasesByCategory(startId);
  const dayIdx = Math.floor(Date.now() / 86_400_000);
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
        <View
          style={{
            borderWidth: 2.5,
            borderColor: INK,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            boxShadow: '3px 3px 0px #15130F',
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 15, color: INK }}>🔥 {progress.streak?.count ?? 0}</Text>
        </View>
      </View>

      {/* word of the day (from chosen starter pack) */}
      {featured && (
        <Pressable
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
          return (
            <Pressable
              key={c.id}
              onPress={() => (locked ? router.push('/paywall' as never) : router.push(`/category/${c.id}`))}
              style={{
                width: '48%',
                minHeight: 118,
                borderWidth: 3,
                borderColor: INK,
                borderRadius: 20,
                backgroundColor: c.tileBg,
                padding: 13,
                justifyContent: 'space-between',
                boxShadow: '4px 4px 0px #15130F',
                opacity: locked ? 0.55 : 1,
              }}
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
                  {locked ? '🔒 ' : ''}
                  {c.peek}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => (isPro ? resetProDemo() : router.push('/paywall' as never))}
        style={{ paddingTop: 18, paddingBottom: 4 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 12, color: '#8a8475' }}>
          {isPro ? '✨ Pro active (demo) · tap to reset' : '🔒 Unlock all packs with Pro →'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
