import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { loadCategories, loadPhrasesByCategory } from '../lib/content/loadContent';
import { loadProgress, Progress } from '../store/progress';
import { FONT } from '../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';

export default function DexHome() {
  const router = useRouter();
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setP);
    }, []),
  );

  const cats = loadCategories().filter((c) => loadPhrasesByCategory(c.id).length > 0);

  if (!p) {
    return (
      <View style={{ flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Collection' }} />
        <Text>…</Text>
      </View>
    );
  }

  const collected = (catId: string, id: string) =>
    (p.seenByCategory[catId] ?? []).includes(id) || !!p.words[id];
  const all = cats.flatMap((c) => loadPhrasesByCategory(c.id));
  const totalGot = all.filter((ph) => collected(ph.categoryId, ph.id)).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
      <Stack.Screen options={{ title: 'Collection', headerBackTitle: 'Home' }} />
      <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 24, color: INK }}>Your collection 📖</Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: '#8a8475', marginTop: 4, marginBottom: 8 }}>
        {totalGot} / {all.length} words collected · pick a pack
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {cats.map((c) => {
          const pool = loadPhrasesByCategory(c.id);
          const got = pool.filter((ph) => collected(c.id, ph.id)).length;
          const pct = pool.length ? Math.round((got / pool.length) * 100) : 0;
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/dex/${c.id}` as never)}
              style={{
                width: '48%',
                borderWidth: 3,
                borderColor: INK,
                borderRadius: 20,
                backgroundColor: c.tileBg,
                padding: 13,
                boxShadow: '4px 4px 0px #15130F',
              }}
            >
              <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
              <Text style={{ fontWeight: '900', fontSize: 15, color: INK, marginTop: 6 }}>{c.nameEn}</Text>
              <Text style={{ fontWeight: '700', fontSize: 11, color: INK, opacity: 0.62, marginBottom: 8 }}>
                {c.nameJa}
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 13, color: INK }}>
                {got}/{pool.length} collected
              </Text>
              <View style={{ height: 7, backgroundColor: '#ffffff', borderRadius: 999, borderWidth: 1.5, borderColor: INK, overflow: 'hidden', marginTop: 6 }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.back()}
        style={{ marginTop: 26, backgroundColor: INK, borderRadius: 14, padding: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>← Back home</Text>
      </Pressable>
    </ScrollView>
  );
}
