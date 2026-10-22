import { useState } from 'react';
import { createParentChallenge, isParentAnswer, type ParentChallenge } from '@kids/learning-core';
import { useLocale } from '../../i18n';
import { AuthScaffold, Field, PrimaryButton } from '../../ui/forms';

export default function ParentGateScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useLocale();
  const [challenge, setChallenge] = useState<ParentChallenge>(() => createParentChallenge());
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = () => {
    if (!isParentAnswer(challenge, answer)) {
      setWrong(true);
      setAnswer('');
      setChallenge(createParentChallenge());
      return;
    }
    onUnlock();
  };

  return (
    <AuthScaffold title={t('parentGateTitle')} body={t('parentGateBody')}>
      <Field
        label={`${challenge.prompt}. ${t('parentAnswer')}`}
        value={answer}
        onChangeText={(value) => {
          setAnswer(value);
          setWrong(false);
        }}
        error={wrong ? t('parentWrong') : undefined}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <PrimaryButton label={t('parentContinue')} onPress={submit} />
    </AuthScaffold>
  );
}
