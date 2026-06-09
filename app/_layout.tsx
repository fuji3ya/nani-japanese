import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  useFonts,
  LINESeedJP_400Regular,
  LINESeedJP_700Bold,
  LINESeedJP_800ExtraBold,
} from '@expo-google-fonts/line-seed-jp';
import { initPurchases, getEntitlementStatus, onProActive } from '../lib/purchases';
import { persistPro } from '../store/progress';

// Reconcile the entitlement with the live RC status.
// `null` (offline / error) keeps the cached value, so a network blip never
// downgrades a paying user; a refund/expiry is dropped as soon as one online
// check succeeds. Writes ONLY the dedicated pro key — never the learning blob,
// so it can't clobber an in-flight lesson save.
let reconciling = false;
async function reconcilePro() {
  if (reconciling) return; // in-flight guard: AppState 'active' can fire repeatedly
  reconciling = true;
  try {
    const status = await getEntitlementStatus();
    if (status !== null) await persistPro(status); // null = indeterminate → keep cache
  } catch (e) {
    console.warn('[nani] reconcilePro', (e as Error)?.message);
  } finally {
    reconciling = false;
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
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
        onProActive(() => { void persistPro(true); }); // instant grant (Ask-to-Buy etc.)
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

  // Render once fonts load OR if they fail (fall back to system font instead of
  // hanging forever on a blank screen).
  if (!loaded && !error) return null;
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
