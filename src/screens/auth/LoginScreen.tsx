import { useRef, useState } from 'react';
import { type TextInputInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { validateIdentifier } from '../../auth/validation';
import { useLocale } from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { AuthScaffold, BannerError, Field, PrimaryButton, SecondaryButton, TextLink } from '../../ui/forms';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { signIn, busy, error, clearError } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [identifierError, setIdentifierError] = useState<MessageKey | null>(null);
  const [passwordError, setPasswordError] = useState<MessageKey | null>(null);

  const submit = () => {
    const nextIdentifier = validateIdentifier(identifier);
    const nextPassword = password ? null : ('passwordRequired' as const);
    setIdentifierError(nextIdentifier);
    setPasswordError(nextPassword);
    if (nextIdentifier || nextPassword) return;
    void signIn({ identifier, password });
  };

  return (
    <AuthScaffold title={t('welcomeBack')} body={t('loginSupport')} onBack={() => router.back()}>
      <BannerError message={error ? t(messageForFailure(error.code)) : undefined} />
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        label={t('password')}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setPasswordError(null);
          clearError();
        }}
        error={passwordError ? t(passwordError) : undefined}
        secureTextEntry={!visible}
        onToggleSecure={() => setVisible((current) => !current)}
        showLabel={t('showPassword')}
        hideLabel={t('hidePassword')}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={submit}
        inputRef={passwordRef}
      />
      <TextLink label={t('forgot')} onPress={() => router.push('/forgot')} />
      <PrimaryButton label={busy ? t('pleaseWait') : t('signIn')} onPress={submit} busy={busy} />
      <SecondaryButton label={t('createAccount')} onPress={() => router.push('/register')} disabled={busy} />
    </AuthScaffold>
  );
}
