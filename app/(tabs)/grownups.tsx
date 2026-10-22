import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import ParentGateScreen from '../../src/screens/auth/ParentGateScreen';
import SettingsScreen from '../../src/screens/SettingsScreen';

export default function Grownups() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setUnlocked(false);
    });
    return () => subscription.remove();
  }, []);

  if (!unlocked) return <ParentGateScreen onUnlock={() => setUnlocked(true)} />;
  return <SettingsScreen />;
}
