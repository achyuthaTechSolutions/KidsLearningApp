import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { validateIdentifier } from '../../auth/validation';
import { useLocale } from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { AuthScaffold, BannerError, Field, PrimaryButton, SecondaryButton } from '../../ui/forms';
import { usePalette } from '../../ui/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { t, bodyFont } = useLocale();
  const { requestRecovery, busy, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState<MessageKey | null>(null);
  const [sent, setSent] = useState(false);

  const submit = () => {
    const next = validateIdentifier(identifier);
    setIdentifierError(next);
    if (next) return;
    void requestRecovery(identifier).then((result) => {
      if (result === 'accepted') setSent(true);
    });
  };

  return (
    <AuthScaffold title={t('forgotTitle')} body={t('forgotSupport')} onBack={() => router.back()}>
      {sent ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: 24, color: palette.text }}>{t('forgotSent')}</Text> : null}
      <BannerError message={!sent && error ? t(messageForFailure(error.code, 'forgot')) : undefined} />
      {sent ? null : (
        <Field
          label={t('identifier')}
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
            setIdentifierError(null);
            clearError();
          }}
          error={identifierError ? t(identifierError) : undefined}
          keyboardType="email-address"
          autoComplete="username"
          textContentType="username"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      )}
      {sent ? null : <PrimaryButton label={busy ? t('pleaseWait') : t('sendRecovery')} onPress={submit} busy={busy} />}
      <SecondaryButton label={t('backToSignIn')} onPress={() => router.replace('/login')} />
    </AuthScaffold>
  );
}
