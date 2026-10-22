import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = 'kids-learning-onboarding';

export async function readOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    // A failed flag must not block sign-in or registration.
  }
}
