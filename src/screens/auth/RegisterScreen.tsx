import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { hasErrors, validateRegistration, type RegisterFieldErrors } from '../../auth/validation';
import { useLocale } from '../../i18n';
import { AuthScaffold, BannerError, CheckboxField, Field, PrimaryButton, TextLink } from '../../ui/forms';
import { usePalette } from '../../ui/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { t, bodyFont } = useLocale();
  const palette = usePalette();
  const { register, busy, error, clearError } = useAuth();
  const identifierRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});

  const submit = () => {
    const next = validateRegistration({ name, identifier, password, confirmation, acceptedTerms });
    setErrors(next);
    if (hasErrors(next)) return;
    void register({ name: name.trim(), identifier, password, acceptedTerms });
  };

  return (
    <AuthScaffold title={t('registerTitle')} body={t('registerSupport')} onBack={() => router.back()}>
      <BannerError message={error ? t(messageForFailure(error.code)) : undefined} />
      <Field
        label={t('parentName')}
        value={name}
        onChangeText={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
          clearError();
        }}
        error={errors.name ? t(errors.name) : undefined}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => identifierRef.current?.focus()}
      />
      <Field
        label={t('identifier')}
        value={identifier}
        onChangeText={(value) => {
          setIdentifier(value);
          setErrors((current) => ({ ...current, identifier: undefined }));
          clearError();
        }}
        error={errors.identifier ? t(errors.identifier) : undefined}
        keyboardType="email-address"
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        inputRef={identifierRef}
      />
      <Field
        label={t('password')}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
          clearError();
        }}
        error={errors.password ? t(errors.password) : undefined}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        inputRef={passwordRef}
      />
      <Field
        label={t('confirmPassword')}
        value={confirmation}
        onChangeText={(value) => {
          setConfirmation(value);
          setErrors((current) => ({ ...current, confirmation: undefined }));
        }}
        error={errors.confirmation ? t(errors.confirmation) : undefined}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        inputRef={confirmRef}
      />
      <Text style={{ fontFamily: bodyFont, fontSize: 15, lineHeight: 21, color: palette.muted }}>{t('passwordRules')}</Text>
      <CheckboxField
        label={t('termsAccept')}
        checked={acceptedTerms}
        onChange={(checked) => {
          setAcceptedTerms(checked);
          setErrors((current) => ({ ...current, terms: undefined }));
        }}
        error={errors.terms ? t(errors.terms) : undefined}
      />
      <TextLink label={t('terms')} onPress={() => router.push('/legal-terms')} />
      <TextLink label={t('privacy')} onPress={() => router.push('/legal-privacy')} />
      <PrimaryButton label={busy ? t('pleaseWait') : t('createAccount')} onPress={submit} busy={busy} />
    </AuthScaffold>
  );
}
