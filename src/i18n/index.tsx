import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { NotoSansTelugu_600SemiBold, NotoSansTelugu_700Bold } from '@expo-google-fonts/noto-sans-telugu';
import { NotoSansDevanagari_600SemiBold, NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari';
import { dictionaries, isLocale, type Locale, type MessageKey } from './messages';

export const LOCALE_KEY = 'kids-learning-locale';

const families = {
  en: { title: 'Fredoka_700Bold', body: 'Nunito_700Bold' },
  te: { title: 'NotoSansTelugu_700Bold', body: 'NotoSansTelugu_600SemiBold' },
  hi: { title: 'NotoSansDevanagari_700Bold', body: 'NotoSansDevanagari_600SemiBold' },
} as const;

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  titleFont: string | undefined;
  bodyFont: string | undefined;
  fontsReady: boolean;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function fontFamily(locale: Locale, role: 'title' | 'body', customReady: boolean): string | undefined {
  if (!customReady) return undefined;
  return families[locale][role];
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    NotoSansTelugu_600SemiBold,
    NotoSansTelugu_700Bold,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });
  const customFonts = Boolean(fontsLoaded && !fontError);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LOCALE_KEY)
      .then((value) => {
        if (active && isLocale(value)) setLocaleState(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_KEY, next).catch(() => undefined);
  };

  const value = useMemo<LocaleValue>(() => ({
    locale,
    setLocale,
    t: (key) => dictionaries[locale][key],
    titleFont: fontFamily(locale, 'title', customFonts),
    bodyFont: fontFamily(locale, 'body', customFonts),
    fontsReady: fontsLoaded || Boolean(fontError),
  }), [customFonts, fontsLoaded, fontError, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
