import { Stack } from 'expo-router';
import { useEffect } from 'react';
import {
  useFonts,
  LINESeedJP_400Regular,
  LINESeedJP_700Bold,
  LINESeedJP_800ExtraBold,
} from '@expo-google-fonts/line-seed-jp';
import { initPurchases, isPro } from '../lib/purchases';
import { loadProgress, saveProgress, setPro } from '../store/progress';

export default function RootLayout() {
  const [loaded] = useFonts({
    LINESeedJP_400Regular,
    LINESeedJP_700Bold,
    LINESeedJP_800ExtraBold,
  });

  // Init RevenueCat and reconcile the local `pro` cache with the live
  // entitlement (so an expired/restored subscription is reflected on launch).
  useEffect(() => {
    (async () => {
      try {
        await initPurchases();
        const pro = await isPro();
        const p = await loadProgress();
        if (p.pro !== pro) await saveProgress(setPro(p, pro));
      } catch (e) {
        // non-fatal — gating falls back to the stored flag
        console.warn('[nani] purchases init', (e as Error)?.message);
      }
    })();
  }, []);

  if (!loaded) return null;
  // No native title text: every screen renders its own big in-content heading,
  // so the header is just a clean paper bar with a back chevron.
  return (
    <Stack
      screenOptions={{
        headerTitle: () => null,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#FFFDF7' },
        headerTintColor: '#15130F',
      }}
    />
  );
}
