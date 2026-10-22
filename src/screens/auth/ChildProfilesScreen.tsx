import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { AvatarId } from '../../auth/contract';
import { useAuth } from '../../auth/AuthProvider';
import { messageForFailure } from '../../auth/failureCopy';
import { useLocale } from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { AuthScaffold, BannerError, ChoiceCard, PrimaryButton, SecondaryButton } from '../../ui/forms';
import { AnimalBadge } from '../../ui/storybook';
import { usePalette } from '../../ui/theme';

const avatarKey: Record<AvatarId, MessageKey> = {
  lion: 'avatarLion',
  rabbit: 'avatarRabbit',
  elephant: 'avatarElephant',
  turtle: 'avatarTurtle',
  monkey: 'avatarMonkey',
};

const ageKey = { '3-4': 'age34', '5-6': 'age56', '7-8': 'age78' } as const;

export default function ChildProfilesScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { t, bodyFont } = useLocale();
  const { profiles, chooseChild, busy, error } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <AuthScaffold title={t('childrenTitle')} body={t('childrenBody')}>
      <BannerError message={error ? t(messageForFailure(error.code)) : undefined} />
      {profiles.length === 0 ? <Text style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: 24, color: palette.muted }}>{t('noChildren')}</Text> : null}
      {profiles.map((profile) => (
        <ChoiceCard
          key={profile.id}
          label={`${profile.nickname}. ${t(ageKey[profile.ageBand])}`}
          selected={selected === profile.id}
          onPress={() => setSelected(profile.id)}
        >
          <AnimalBadge avatar={profile.avatar} label={t(avatarKey[profile.avatar])} />
        </ChoiceCard>
      ))}
      <SecondaryButton label={t('addChild')} onPress={() => router.push('/add-child')} disabled={busy} />
      <PrimaryButton label={busy ? t('pleaseWait') : t('continueLearning')} onPress={() => selected && void chooseChild(selected)} disabled={!selected} busy={busy} />
    </AuthScaffold>
  );
}
