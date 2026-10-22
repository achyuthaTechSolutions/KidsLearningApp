import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { usePalette } from '../../src/ui/theme';

function Icon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const palette = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        headerTitleStyle: { fontFamily: 'Fredoka_700Bold' },
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.outline, minHeight: 64, paddingBottom: 6, paddingTop: 6 },
        tabBarActiveTintColor: '#6C4EF5',
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: () => <Icon emoji="🏡" />, tabBarAccessibilityLabel: 'Home' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarLabel: 'Learn', tabBarIcon: () => <Icon emoji="🔤" />, tabBarAccessibilityLabel: 'Learn' }} />
      <Tabs.Screen name="play" options={{ title: 'Play', tabBarLabel: 'Play', tabBarIcon: () => <Icon emoji="🎮" />, tabBarAccessibilityLabel: 'Play' }} />
      <Tabs.Screen name="badges" options={{ title: 'Badges', tabBarLabel: 'Badges', tabBarIcon: () => <Icon emoji="🏆" />, tabBarAccessibilityLabel: 'Badges' }} />
      <Tabs.Screen name="grownups" options={{ title: 'Parents', tabBarLabel: 'Parents', tabBarIcon: () => <Icon emoji="⚙️" />, tabBarAccessibilityLabel: 'Parent settings' }} />
    </Tabs>
  );
}
