import { Stack } from 'expo-router';
import {
  useFonts,
  LINESeedJP_400Regular,
  LINESeedJP_700Bold,
  LINESeedJP_800ExtraBold,
} from '@expo-google-fonts/line-seed-jp';

export default function RootLayout() {
  const [loaded] = useFonts({
    LINESeedJP_400Regular,
    LINESeedJP_700Bold,
    LINESeedJP_800ExtraBold,
  });
  if (!loaded) return null;
  return <Stack screenOptions={{ headerLargeTitle: true }} />;
}
