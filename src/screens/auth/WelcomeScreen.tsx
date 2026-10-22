import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { useLocale } from '../../i18n';
import { AuthScaffold, LanguageSelector, PrimaryButton, SecondaryButton } from '../../ui/forms';
import { StorybookScene } from '../../ui/storybook';
import { authColors, usePalette } from '../../ui/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { t, titleFont, bodyFont } = useLocale();
  const { completeOnboarding } = useAuth();

  const leave = (path: '/register' | '/login') => {
    void completeOnboarding();
    router.push(path);
  };

  return (
    <AuthScaffold>
      <StorybookScene label={t('storyLabel')} />
      <Text style={{ fontFamily: titleFont, fontSize: 34, lineHeight: 42, color: authColors.primary }}>{t('brand')}</Text>
      <Text style={{ fontFamily: titleFont, fontSize: 28, lineHeight: 36, color: palette.text }}>{t('tagline')}</Text>
      <Text style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: 24, color: palette.muted }}>{t('welcomeBody')}</Text>
      <LanguageSelector />
      <PrimaryButton label={t('getStarted')} onPress={() => leave('/register')} />
      <SecondaryButton label={t('haveAccount')} onPress={() => leave('/login')} />
    </AuthScaffold>
  );
}
