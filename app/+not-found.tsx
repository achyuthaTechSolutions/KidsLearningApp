import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>This page is not in the app.</Text>
      <Link href="/" style={{ fontSize: 20 }}>
        Go to Home
      </Link>
    </View>
  );
}
