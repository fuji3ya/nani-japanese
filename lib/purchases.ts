/**
 * Nani?! Japanese — RevenueCat client wrapper.
 *
 * Pro unlocks all 8 packs + unlimited new words/day.
 * Products (App Store Connect / RevenueCat):
 *   nani_monthly  — $4.99 / month
 *   nani_annual   — $39.99 / year
 * Entitlement lookup_key: `pro`.
 *
 * When EXPO_PUBLIC_RC_API_KEY_IOS is not set, runs in a local mock mode so the
 * UI is testable before the RC key + ASC products go live.
 */
import Purchases, { LOG_LEVEL, type PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS;
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID;
const ENTITLEMENT_ID = 'pro';
const MONTHLY_ID = 'nani_monthly';
const ANNUAL_ID = 'nani_annual';
const MOCK_KEY = 'jpkotoba:mockEntitlement';

let initialized = false;
const hasKey = () => (Platform.OS === 'ios' ? !!RC_API_KEY_IOS : !!RC_API_KEY_ANDROID);
// The mock entitlement may ONLY grant pro in development. In a Release build the
// mock branch can never unlock pro even if the RC key were somehow absent — this
// makes "free pro for everyone on a mis-built binary" structurally impossible.
const MOCK_OK = __DEV__;

export async function initPurchases(userId?: string): Promise<void> {
  if (initialized) return;
  const key = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!key) {
    initialized = true; // mock mode
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  await Purchases.configure({ apiKey: key, appUserID: userId });
  // Catch out-of-band grants the moment they land (Ask-to-Buy parental
  // approval, deferred SCA, network-drop reconcile) — without waiting for the
  // next foreground reconcile. Upgrade-only.
  try {
    Purchases.addCustomerInfoUpdateListener((info) => {
      if (info.entitlements.active[ENTITLEMENT_ID]?.isActive) onProActiveCb?.();
    });
  } catch { /* best-effort */ }
  initialized = true;
}

let onProActiveCb: (() => void) | null = null;
/** Register a callback fired when the pro entitlement becomes active. */
export function onProActive(cb: () => void): void {
  onProActiveCb = cb;
}

async function currentOffering(): Promise<PurchasesOffering | null> {
  if (!hasKey()) return null;
  try {
    const o = await Purchases.getOfferings();
    return o.current ?? null;
  } catch {
    return null;
  }
}

/** Localized price strings for the paywall; falls back to USD when RC isn't live. */
export async function getPlanPrices(): Promise<{ monthly: string; annual: string }> {
  const fallback = { monthly: '$4.99 / month', annual: '$39.99 / year' };
  const offering = await currentOffering();
  if (!offering) return fallback;
  const pkgs = offering.availablePackages ?? [];
  const m = pkgs.find((p) => p.product.identifier === MONTHLY_ID);
  const a = pkgs.find((p) => p.product.identifier === ANNUAL_ID);
  return {
    monthly: m?.product.priceString ? `${m.product.priceString} / month` : fallback.monthly,
    annual: a?.product.priceString ? `${a.product.priceString} / year` : fallback.annual,
  };
}

/** Returns true if the user is now Pro. */
export async function purchasePlan(plan: 'monthly' | 'annual'): Promise<boolean> {
  if (!hasKey()) {
    if (!MOCK_OK) return false; // Release without a key: never fake a purchase
    await AsyncStorage.setItem(MOCK_KEY, '1'); // dev-only mock success for UX testing
    return true;
  }
  try {
    const offering = await currentOffering();
    const pkgs = offering?.availablePackages ?? [];
    const id = plan === 'annual' ? ANNUAL_ID : MONTHLY_ID;
    const pkg = pkgs.find((p) => p.product.identifier === id);
    if (!pkg) throw new Error(`package_${id}_not_found`);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    console.warn('[nani] purchase failed', e?.message);
    return false;
  }
}

export async function isPro(): Promise<boolean> {
  if (!hasKey()) {
    return MOCK_OK && (await AsyncStorage.getItem(MOCK_KEY)) === '1';
  }
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
  } catch {
    return false;
  }
}

/**
 * Live 'pro' entitlement status for reconciling the local cache:
 *   true  → entitlement active (grant)
 *   false → RC definitively says inactive (drop — expired/refunded)
 *   null  → could NOT determine (offline / RC error) → caller MUST keep the
 *           cached value, so a transient network blip never locks out a payer.
 * This is the safe variant of isPro() for the launch/foreground reconcile.
 */
export async function getEntitlementStatus(): Promise<boolean | null> {
  if (!hasKey()) {
    return MOCK_OK ? (await AsyncStorage.getItem(MOCK_KEY)) === '1' : false;
  }
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
  } catch {
    return null; // indeterminate — do not downgrade
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!hasKey()) return isPro();
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
  } catch {
    return false;
  }
}
