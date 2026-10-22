import { useRouter } from 'expo-router';
import { sectionCatalog, type SectionInfo } from '@kids/learning-core';
import { ActivityCard, Hero, Screen } from '../ui/components';
import { useLearning } from '../hooks/useLearning';

function Hub({ group, title, subtitle, emoji, world }: { group: SectionInfo['group']; title: string; subtitle: string; emoji: string; world: SectionInfo['world'] }) {
  const router = useRouter();
  const { say } = useLearning();
  const items = sectionCatalog.filter((section) => section.group === group && section.path !== '/achievements');
  return (
    <Screen>
      <Hero world={world} emoji={emoji} title={title} subtitle={subtitle} />
      {items.map((section) => (
        <ActivityCard
          key={section.path}
          title={section.label}
          subtitle={section.tagline}
          emoji={section.emoji}
          world={section.world}
          onPress={() => {
            router.push(section.path as never);
            say(section.label);
          }}
        />
      ))}
    </Screen>
  );
}

export function LearnHub() {
  return <Hub group="learn" title="Learn" subtitle="Letters, numbers, animals, and words." emoji="📚" world="green" />;
}

export function PlayHub() {
  return <Hub group="play" title="Play" subtitle="A challenge, a dash, music, and games." emoji="🎮" world="teal" />;
}
