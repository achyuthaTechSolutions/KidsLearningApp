import { useEffect, useRef } from 'react';
import { AppState, Text, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTheme, usePalette } from '../src/ui/theme';
import { Mascot } from '../src/ui/components';
import { useAppStore } from '../src/store/useAppStore';
import { prepareAudio, resumeAudio, stopAllAudio, suspendAudio } from '../src/services/audio';
import { cancelSpeech } from '../src/services/speech';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppTheme>
        <RootNavigator />
      </AppTheme>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const palette = usePalette();
  const ready = useAppStore((state) => state.ready);
  const hydrate = useAppStore((state) => state.hydrate);
  const pathname = usePathname();
  const previous = useRef(pathname);
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    void hydrate();
    void prepareAudio();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded && ready) void SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  useEffect(() => {
    if (previous.current !== pathname) {
      cancelSpeech();
      stopAllAudio();
      previous.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void resumeAudio();
      else {
        cancelSpeech();
        void suspendAudio();
      }
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background, gap: 12 }}>
        <Mascot />
        <Text style={{ color: palette.text, fontSize: 22 }}>Getting your learning ready</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={palette.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.text,
          headerTitleStyle: { fontFamily: 'Fredoka_700Bold' },
          contentStyle: { backgroundColor: palette.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="keyboard" options={{ title: 'Keyboard Explorer' }} />
        <Stack.Screen name="alphabet" options={{ title: 'Alphabet World' }} />
        <Stack.Screen name="numbers" options={{ title: 'Number World' }} />
        <Stack.Screen name="animals" options={{ title: 'Animal Kingdom' }} />
        <Stack.Screen name="words" options={{ title: 'My First Words' }} />
        <Stack.Screen name="music" options={{ title: 'Music Studio' }} />
        <Stack.Screen name="games" options={{ title: 'Learning Games' }} />
        <Stack.Screen name="daily" options={{ title: 'Daily Challenge' }} />
        <Stack.Screen name="dino" options={{ title: 'Dino Dash' }} />
        <Stack.Screen name="achievements" options={{ title: 'My Achievements' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      </Stack>
    </>
  );
}
