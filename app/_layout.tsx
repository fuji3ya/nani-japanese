import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  useFonts,
  LINESeedJP_400Regular,
  LINESeedJP_700Bold,
  LINESeedJP_800ExtraBold,
} from '@expo-google-fonts/line-seed-jp';
import { initPurchases, getEntitlementStatus } from '../lib/purchases';
import { loadProgress, saveProgress, setPro } from '../store/progress';

// Reconcile the cached `pro` flag with the live RC entitlement.
// Only writes when RC returns a definitive boolean: `null` (offline / error)
// keeps the cached value, so a network blip never downgrades a paying user,
// and a refund/expiry is dropped as soon as one online check succeeds.
async function reconcilePro() {
  try {
    const status = await getEntitlementStatus();
    if (status === null) return; // indeterminate — keep cache
    const p = await loadProgress();
    if (p.pro !== status) await saveProgress(setPro(p, status));
  } catch (e) {
    console.warn('[nani] reconcilePro', (e as Error)?.message);
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    LINESeedJP_400Regular,
    LINESeedJP_700Bold,
    LINESeedJP_800ExtraBold,
  });

  // Init RevenueCat once, reconcile on launch, then re-reconcile every time the
  // app returns to the foreground (so an expired/refunded sub drops within one
  // foreground cycle, not only on a cold launch).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initPurchases();
        if (mounted) await reconcilePro();
      } catch (e) {
        console.warn('[nani] purchases init', (e as Error)?.message);
      }
    })();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') reconcilePro();
    });
    return () => {
      mounted = false;
      sub.remove();
    };
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
