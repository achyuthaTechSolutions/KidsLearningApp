import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { AgeBand, AvatarId } from '../../auth/contract';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { validateNickname } from '../../auth/validation';
import { useLocale } from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { AuthScaffold, BannerError, ChoiceCard, Field, PrimaryButton } from '../../ui/forms';
import { AnimalBadge } from '../../ui/storybook';

const avatars: AvatarId[] = ['lion', 'rabbit', 'elephant', 'turtle', 'monkey'];
const ages: AgeBand[] = ['3-4', '5-6', '7-8'];
const avatarKey = {
  lion: 'avatarLion',
  rabbit: 'avatarRabbit',
  elephant: 'avatarElephant',
  turtle: 'avatarTurtle',
  monkey: 'avatarMonkey',
} as const;
const ageKey = { '3-4': 'age34', '5-6': 'age56', '7-8': 'age78' } as const;

export default function CreateChildScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { addChild, busy, error, clearError } = useAuth();
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<MessageKey | null>(null);
  const [ageBand, setAgeBand] = useState<AgeBand>('5-6');
  const [avatar, setAvatar] = useState<AvatarId>('lion');

  const submit = () => {
    const next = validateNickname(nickname);
    setNicknameError(next);
    if (next) return;
    void addChild({ nickname, ageBand, avatar }).then((saved) => {
      if (saved) router.back();
    });
  };

  return (
    <AuthScaffold title={t('addChild')} body={t('childrenBody')} onBack={() => router.back()}>
      <BannerError message={error ? t(messageForFailure(error.code)) : undefined} />
      <Field
        label={t('nickname')}
        value={nickname}
        onChangeText={(value) => {
          setNickname(value);
          setNicknameError(null);
          clearError();
        }}
        error={nicknameError ? t(nicknameError) : undefined}
        autoCapitalize="words"
        autoComplete="off"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {ages.map((band) => (
        <ChoiceCard key={band} label={t(ageKey[band])} selected={ageBand === band} onPress={() => setAgeBand(band)} />
      ))}
      {avatars.map((item) => (
        <ChoiceCard key={item} label={t(avatarKey[item])} selected={avatar === item} onPress={() => setAvatar(item)}>
          <AnimalBadge avatar={item} label={t(avatarKey[item])} />
        </ChoiceCard>
      ))}
      <PrimaryButton label={busy ? t('pleaseWait') : t('saveProfile')} onPress={submit} busy={busy} />
    </AuthScaffold>
  );
}
