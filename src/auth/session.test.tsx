import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from './AuthProvider';
import { readDevVerificationCode, resetMockAuthServer } from './mockClient';
import { LocaleProvider } from '../i18n';
import { writeSession } from './secureSession';

function Probe() {
  const auth = useAuth();
  return (
    <>
      <Text testID="phase">{auth.phase.kind}</Text>
      <Text testID="profiles">{String(auth.profiles.length)}</Text>
      <Pressable
        accessibilityLabel="register"
        onPress={() => void auth.register({
          name: 'Ada Parent',
          identifier: 'parent@example.com',
          password: 'Storybook1',
          acceptedTerms: true,
        })}
      />
      <Pressable
        accessibilityLabel="verify"
        onPress={() => {
          if (auth.phase.kind !== 'verify') return;
          void auth.confirmCode(readDevVerificationCode(auth.phase.pendingId) ?? '');
        }}
      />
      <Pressable
        accessibilityLabel="wrong-code"
        onPress={() => {
          if (auth.phase.kind !== 'verify') return;
          const real = readDevVerificationCode(auth.phase.pendingId);
          void auth.confirmCode(real === '111111' ? '222222' : '111111');
        }}
      />
      <Pressable accessibilityLabel="add" onPress={() => void auth.addChild({ nickname: 'Sunny', ageBand: '5-6', avatar: 'lion' })} />
      <Pressable
        accessibilityLabel="choose"
        onPress={() => {
          const childId = auth.profiles[0]?.id;
          if (childId) void auth.chooseChild(childId);
        }}
      />
      <Pressable accessibilityLabel="leave" onPress={() => void auth.signOut()} />
      <Text>{auth.error?.code ?? ''}</Text>
    </>
  );
}

function renderProbe() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <LocaleProvider>
        <AuthProvider>{authTree()}</AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>,
  );
}

function authTree() {
  return <Probe />;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetMockAuthServer();
  (SecureStore as unknown as { __reset: () => void }).__reset();
});

describe('session', () => {
  it('verifies, restores a child session, and clears it on sign out', async () => {
    const first = await renderProbe();
    expect(await screen.findByText('signedOut')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('register'));
    expect(await screen.findByText('verify')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('wrong-code'));
    expect(await screen.findByText('verification_failed')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('verify'));
    expect(await screen.findByText('chooseChild')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('add'));
    expect(await screen.findByText('1')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('choose'));
    expect(await screen.findByText('ready')).toBeTruthy();
    await first.unmount();

    await renderProbe();
    expect(await screen.findByText('ready')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('leave'));
    expect(await screen.findByText('signedOut')).toBeTruthy();
    await waitFor(async () => {
      expect(await SecureStore.getItemAsync('kids-learning-session')).toBeNull();
    });
  });

  it('drops an expired session when refresh fails', async () => {
    await writeSession({
      accessToken: 'access_missing',
      refreshToken: 'refresh_missing',
      expiresAt: Date.now() - 1000,
      parentId: 'parent',
      parentName: 'Ada',
      selectedChildId: 'child',
    });
    await renderProbe();
    expect(await screen.findByText('signedOut')).toBeTruthy();
    expect(await SecureStore.getItemAsync('kids-learning-session')).toBeNull();
  });
});
