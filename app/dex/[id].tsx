import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { findCategory, loadPhrasesByCategory } from '../../lib/content/loadContent';
import { loadProgress, Progress } from '../../store/progress';
import { FONT } from '../../lib/theme';

const INK = '#15130F';
const PAPER = '#FFFDF7';
const GOLD = '#C9A227';
const VINTAGE = /江戸|平安|コギャル|平成|ネット老人|バブル/;

export default function DexCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cat = findCategory(id!);
  const pool = loadPhrasesByCategory(id!);
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => {
    loadProgress().then(setP);
  }, []);

  if (!p || !cat) {
    return (
      <View style={{ flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: cat ? cat.nameEn : 'Collection' }} />
        <Text>…</Text>
      </View>
    );
  }

  const isCollected = (phraseId: string) =>
    (p.seenByCategory[id!] ?? []).includes(phraseId) || !!p.words[phraseId];
  const isMastered = (phraseId: string) => (p.words[phraseId]?.box ?? 0) >= 5;
  const got = pool.filter((ph) => isCollected(ph.id)).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
      <Stack.Screen options={{ title: `${cat.emoji} ${cat.nameEn}`, headerBackTitle: 'Collection' }} />
      <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 22, color: INK }}>
        {cat.emoji} {cat.nameEn}
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: '#8a8475', marginTop: 4, marginBottom: 12 }}>
        {got} / {pool.length} collected · ⭐ mastered · gold = vintage
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pool.map((ph) => {
          const cd = isCollected(ph.id);
          const mastered = isMastered(ph.id);
          const vintage = cd && VINTAGE.test(ph.tag.era);
          return (
            <View
              key={ph.id}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 12,
                borderWidth: vintage ? 3 : 2,
                borderColor: vintage ? GOLD : INK,
                backgroundColor: cd ? cat.tileBg : '#EFEce3',
                boxShadow: cd ? `3px 3px 0px ${vintage ? GOLD : INK}` : undefined,
              }}
            >
              <Text style={{ fontWeight: '900', fontSize: 15, color: cd ? INK : '#b8b2a3' }}>
                {cd ? ph.term : '？？？'}
                {mastered ? ' ⭐' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.back()}
        style={{ marginTop: 26, backgroundColor: INK, borderRadius: 14, padding: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>← All packs</Text>
      </Pressable>
    </ScrollView>
  );
}
