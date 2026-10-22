import { useEffect, useRef } from 'react';
import { AppState, Text, View } from 'react-native';
import { Stack, usePathname, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { decideNavigation } from '../src/auth/navigation';
import { LocaleProvider, useLocale } from '../src/i18n';
import { AppTheme, usePalette } from '../src/ui/theme';
import { Mascot } from '../src/ui/components';
import { useAppStore } from '../src/store/useAppStore';
import { prepareAudio, resumeAudio, stopAllAudio, suspendAudio } from '../src/services/audio';
import { cancelSpeech } from '../src/services/speech';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AppTheme>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AppTheme>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const palette = usePalette();
  const { t, titleFont, fontsReady } = useLocale();
  const { phase } = useAuth();
  const ready = useAppStore((state) => state.ready);
  const hydrate = useAppStore((state) => state.hydrate);
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    void hydrate();
    void prepareAudio();
  }, [hydrate]);

  useEffect(() => {
    if (fontsReady && ready && phase.kind !== 'loading') void SplashScreen.hideAsync();
  }, [fontsReady, phase.kind, ready]);

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

  if (!fontsReady || !ready || phase.kind === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background, gap: 12 }}>
        <Mascot />
        <Text style={{ color: palette.text, fontSize: 22, fontFamily: titleFont }}>{t('loading')}</Text>
      </View>
    );
  }

  const target = decideNavigation(phase, pathname);
  const learning = phase.kind === 'ready';

  return (
    <>
      <StatusBar style={palette.mode === 'dark' ? 'light' : 'dark'} />
      {target ? <Redirect href={target} /> : null}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.text,
          headerTitleStyle: { fontFamily: 'Fredoka_700Bold' },
          contentStyle: { backgroundColor: palette.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        {learning ? (
          <>
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
          </>
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
    </>
  );
}
