import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { findCategory, loadPhrasesByCategory } from '../../lib/content/loadContent';
import { GACHI_EN, Phrase } from '../../lib/content/types';
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
  const [selected, setSelected] = useState<Phrase | null>(null);
  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setP);
    }, []),
  );

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
  const accent = cat.accent;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
      <Stack.Screen options={{ title: `${cat.emoji} ${cat.nameEn}`, headerBackTitle: 'Collection' }} />
      <Text style={{ fontFamily: FONT.heavy, fontWeight: '900', fontSize: 22, color: INK }}>
        {cat.emoji} {cat.nameEn}
      </Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: '#8a8475', marginTop: 4, marginBottom: 12 }}>
        {got} / {pool.length} collected · tap a word to review · ⭐ mastered
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pool.map((ph) => {
          const cd = isCollected(ph.id);
          const mastered = isMastered(ph.id);
          const vintage = cd && VINTAGE.test(ph.tag.era);
          const tileStyle = {
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            borderWidth: vintage ? 3 : 2,
            borderColor: vintage ? GOLD : INK,
            backgroundColor: cd ? cat.tileBg : '#EFEce3',
            boxShadow: cd ? `3px 3px 0px ${vintage ? GOLD : INK}` : undefined,
          } as const;
          const label = (
            <Text style={{ fontWeight: '900', fontSize: 15, color: cd ? INK : '#b8b2a3' }}>
              {cd ? ph.term : '？？？'}
              {mastered ? ' ⭐' : ''}
            </Text>
          );
          // Collected words are tappable to review; locked ones are inert.
          return cd ? (
            <Pressable
              key={ph.id}
              onPress={() => setSelected(ph)}
              accessibilityRole="button"
              accessibilityLabel={`Review ${ph.term}`}
              style={tileStyle}
            >
              {label}
            </Pressable>
          ) : (
            <View key={ph.id} style={tileStyle}>
              {label}
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

      {/* Review modal — tap a collected word to see its meaning/example again */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable
          onPress={() => setSelected(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 22 }}
        >
          {selected && (
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: PAPER,
                borderWidth: 3,
                borderColor: INK,
                borderRadius: 22,
                padding: 20,
                boxShadow: '8px 8px 0px #15130F',
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.heavy,
                  fontWeight: '900',
                  fontSize: 40,
                  color: INK,
                  textAlign: 'center',
                  textShadowColor: cat.kwShadow,
                  textShadowOffset: { width: 4, height: 4 },
                  textShadowRadius: 0,
                }}
              >
                {selected.term}
              </Text>
              {!!selected.romaji && (
                <Text style={{ fontWeight: '800', fontSize: 14, color: accent, textAlign: 'center', marginTop: 4 }}>
                  {selected.romaji}
                </Text>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                <Tag>🕰 {selected.tag.eraEn ?? selected.tag.era}</Tag>
                <Tag>🗣 {selected.tag.whoUsesEn ?? selected.tag.whoUses}</Tag>
                <Tag>{GACHI_EN[selected.tag.gachi]}</Tag>
              </View>

              <Text style={{ fontWeight: '900', fontSize: 10, letterSpacing: 1.5, color: '#b8b2a3', marginTop: 16 }}>
                MEANING
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 19, color: INK, marginTop: 4, lineHeight: 24 }}>
                {selected.meaningEn}
              </Text>
              {!!selected.socialConsequenceEn && (
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#a8662b', marginTop: 10, lineHeight: 19 }}>
                  👉 {selected.socialConsequenceEn}
                </Text>
              )}

              <View style={{ marginTop: 14, borderTopWidth: 2, borderColor: '#e7e3d6', borderStyle: 'dashed', paddingTop: 12 }}>
                <Text style={{ fontWeight: '800', fontSize: 15, color: INK }}>{selected.exampleJa}</Text>
                {!!selected.exampleRomaji && (
                  <Text style={{ fontWeight: '600', fontSize: 12, color: accent, marginTop: 2 }}>
                    {selected.exampleRomaji}
                  </Text>
                )}
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#8a8475', marginTop: 3 }}>
                  {selected.exampleMix ?? selected.exampleEn}
                </Text>
              </View>

              <Pressable
                onPress={() => setSelected(null)}
                style={{ marginTop: 18, backgroundColor: INK, borderRadius: 14, padding: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Close</Text>
              </Pressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 2, borderColor: INK, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#fff' }}>
      <Text style={{ fontWeight: '800', fontSize: 11, color: INK }}>{children}</Text>
    </View>
  );
}
