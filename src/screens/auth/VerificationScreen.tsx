import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { useLocale } from '../../i18n';
import { AuthScaffold, BannerError, Field, PrimaryButton, SecondaryButton } from '../../ui/forms';
import { usePalette } from '../../ui/theme';

export default function VerificationScreen() {
  const palette = usePalette();
  const { t, bodyFont } = useLocale();
  const { phase, confirmCode, resendCode, busy, error, clearError } = useAuth();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase.kind !== 'verify' || phase.retryAt <= Date.now()) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  const waiting = phase.kind === 'verify' && phase.retryAt > now;

  const submit = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setLocalError(true);
      return;
    }
    void confirmCode(code);
  };

  return (
    <AuthScaffold title={t('verifyTitle')} body={t('verifyBody')}>
      {phase.kind === 'verify' ? (
        <Text style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: 24, color: palette.text }}>
          {t('sentTo')}: {phase.identifier}
        </Text>
      ) : null}
      <BannerError message={error ? t(messageForFailure(error.code)) : undefined} />
      <Field
        label={t('code')}
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/[^\d]/g, '').slice(0, 6));
          setLocalError(false);
          clearError();
        }}
        error={localError ? t('verificationFailed') : undefined}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <PrimaryButton label={busy ? t('pleaseWait') : t('verifyAction')} onPress={submit} busy={busy} />
      <SecondaryButton label={waiting ? t('resendWait') : t('resend')} onPress={() => void resendCode()} disabled={busy || waiting} />
    </AuthScaffold>
  );
}
