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
  // No native title text: every screen renders its own big in-content heading,
  // so the header is just a clean paper bar with a back chevron. (headerLargeTitle
  // collided the native title with the body heading.)
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
