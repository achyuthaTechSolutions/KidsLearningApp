import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { AuthScaffold } from '../../ui/forms';
import { usePalette } from '../../ui/theme';

export default function LegalScreen({ titleKey }: { titleKey: 'legalTermsTitle' | 'legalPrivacyTitle' }) {
  const router = useRouter();
  const palette = usePalette();
  const { t, titleFont, bodyFont } = useLocale();
  const sections: MessageKey[] = ['legalIntro', 'legalAccount', 'legalChild', 'legalDevice', 'legalReview'];
  return (
    <AuthScaffold title={t(titleKey)} onBack={() => router.back()}>
      {sections.map((key) => (
        <Text key={key} style={{ fontFamily: key === 'legalIntro' ? titleFont : bodyFont, fontSize: 16, lineHeight: 24, color: palette.text }}>
          {t(key)}
        </Text>
      ))}
    </AuthScaffold>
  );
}
