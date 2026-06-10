// Tiny haptics wrapper — every call is fire-and-forget and swallowed on
// platforms without a Taptic engine (web / older devices / simulator), so
// callers never need to await or guard.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const ok = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tick — button presses, advancing a step. */
export function tapLight(): void {
  if (ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Correct answer. */
export function notifySuccess(): void {
  if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Wrong answer — a soft "uh-oh", not a punishment buzz. */
export function notifyWarning(): void {
  if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** Big moment — session complete / streak extended / purchase success. */
export function celebrate(): void {
  if (!ok) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  // double-tap pattern reads as "celebration", not just "ok"
  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, 120);
}
