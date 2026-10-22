import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton, Body, Hero, Screen, Title } from '../ui/components';
import { usePalette } from '../ui/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const palette = usePalette();
  return (
    <Screen>
      <Hero world="slate" emoji="🛡️" title="Privacy" subtitle="Learning stays on this device." />
      <Block title="What is saved here" body="Letters, numbers, animals, and words a child has explored, game counts, Dino Dash best scores and dinosaur colour, the answer streak, earned achievements, today's daily challenge, and parent settings are saved in this app's private storage. They are not sent to a server, an account, or an analytics service. This app does not include ads." />
      <Block title="What this app does not use" body="There is no sign-in, cloud sync, microphone, camera, location, social sharing, or purchase flow. Spoken words use the device's own speech. Instrument sounds are created on the device. Lessons work without an internet connection. Browser progress from the website is not copied here." />
      <Block title="Reset and uninstall" body="Reset All Progress in Parent Settings asks a grown-up a short question first. Reset clears explored content, scores, the streak, achievements, and today's challenge. It does not change sound or speech settings. Uninstalling the app removes this saved learning." />
      <View style={[styles.note, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
        <Title>Before a store listing</Title>
        <Body>A parent or owner still needs to publish a privacy policy, including a contact method, before submitting either app to a store. This screen describes how this version works. It is not that published policy.</Body>
      </View>
      <BigButton label="Back to settings" world="slate" onPress={() => router.back()} />
      <Text style={{ height: 0 }} />
    </Screen>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.note, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      <Title>{title}</Title>
      <Body>{body}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { borderWidth: 2, borderRadius: 22, padding: 14, gap: 6 },
});
