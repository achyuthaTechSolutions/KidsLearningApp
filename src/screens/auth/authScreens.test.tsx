import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ReactElement } from 'react';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { AuthProvider } from '../../auth/AuthProvider';
import type { AuthClient, AuthResult, SessionGrant } from '../../auth/contract';
import { mockAuthClient, readDevVerificationCode, resetMockAuthServer } from '../../auth/mockClient';
import { writeSession } from '../../auth/secureSession';
import { LocaleProvider } from '../../i18n';
import { fontFamily } from '../../i18n';
import { hi, te } from '../../i18n/messages';
import ParentGateScreen from './ParentGateScreen';
import WelcomeScreen from './WelcomeScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import VerificationScreen from './VerificationScreen';
import ChildProfilesScreen from './ChildProfilesScreen';

const navigation = router as unknown as { push: jest.Mock; replace: jest.Mock; back: jest.Mock };

function renderAuth(ui: ReactElement, client?: AuthClient) {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <LocaleProvider>
        <AuthProvider client={client ?? mockAuthClient}>{ui}</AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetMockAuthServer();
  (SecureStore as unknown as { __reset: () => void }).__reset();
  navigation.push.mockClear();
  navigation.replace.mockClear();
  navigation.back.mockClear();
});

describe('welcome and language', () => {
  it('opens registration or sign in and still moves on if onboarding storage fails', async () => {
    await renderAuth(<WelcomeScreen />);
    expect(screen.getByText('Learn. Imagine. Grow.')).toBeTruthy();
    expect(screen.getByText(/Stories, maths, and values/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Get Started'));
    expect(navigation.push).toHaveBeenCalledWith('/register');
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    await fireEvent.press(screen.getByLabelText('I Already Have an Account'));
    expect(navigation.push).toHaveBeenCalledWith('/login');
  });

  it('switches the welcome copy to Hindi and keeps Telugu and Devanagari fonts', async () => {
    await renderAuth(<WelcomeScreen />);
    await fireEvent.press(screen.getByLabelText('हिंदी'));
    expect(await screen.findByText('सीखें. कल्पना करें. बढ़ें.')).toBeTruthy();
    expect(te.tagline).toMatch(/[\u0C00-\u0C7F]/);
    expect(hi.tagline).toMatch(/[\u0900-\u097F]/);
    expect(fontFamily('te', 'body', true)).toBe('NotoSansTelugu_600SemiBold');
    expect(fontFamily('hi', 'title', true)).toBe('NotoSansDevanagari_700Bold');
    expect(fontFamily('te', 'body', false)).toBeUndefined();
  });
});

describe('login', () => {
  it('validates the identifier, toggles the password, and keeps the keyboard layout', async () => {
    await renderAuth(<LoginScreen />);
    expect(screen.getByTestId('auth-keyboard')).toBeTruthy();
    expect(screen.getByTestId('auth-scroll')).toBeTruthy();
    expect(screen.queryByText(/Google/)).toBeNull();
    expect(screen.queryByText(/Apple/)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Sign In'));
    expect(screen.getByText('Enter an email or mobile number.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Email or mobile number'), ' parent@example.com ');
    await fireEvent.changeText(screen.getByLabelText('Password'), ' Storybook1');
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByLabelText('Show password'));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Password').props.value).toBe(' Storybook1');
  });

  it('shows a safe error, disables the button while waiting, and ignores a second tap', async () => {
    let finish: (result: AuthResult<SessionGrant>) => void = () => undefined;
    const login = jest.fn(() => new Promise<AuthResult<SessionGrant>>((resolve) => {
      finish = resolve;
    }));
    const client = { ...mockAuthClient, login } satisfies AuthClient;
    await renderAuth(<LoginScreen />, client);
    await fireEvent.changeText(screen.getByLabelText('Email or mobile number'), 'parent@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Storybook1');
    await fireEvent.press(screen.getByLabelText('Sign In'));
    expect(login).toHaveBeenCalledTimes(1);
    const waiting = screen.getByLabelText('Please wait');
    expect(waiting.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(waiting);
    expect(login).toHaveBeenCalledTimes(1);
    finish({ ok: false, error: { code: 'invalid_credentials' } });
    expect(await screen.findByText(/could not sign you in/i)).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});

describe('registration and recovery', () => {
  it('checks the password, confirmation, and terms before creating an account', async () => {
    const register = jest.spyOn(mockAuthClient, 'register');
    await renderAuth(<RegisterScreen />);
    await fireEvent.changeText(screen.getByLabelText('Parent or guardian name'), 'Ada Parent');
    await fireEvent.changeText(screen.getByLabelText('Email or mobile number'), 'parent@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Storybook1');
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'Otherpass1');
    await fireEvent.press(screen.getByLabelText('Create Account'));
    expect(screen.getByText('The passwords do not match.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'Storybook1');
    await fireEvent.press(screen.getByLabelText('Create Account'));
    expect(screen.getByText(/Accept the Terms/)).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByLabelText('Create Account'));
    await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Ada Parent',
      password: 'Storybook1',
      acceptedTerms: true,
    })));
  });

  it('shows the same recovery confirmation for any identifier', async () => {
    await renderAuth(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email or mobile number'), 'missing@example.com');
    await fireEvent.press(screen.getByLabelText('Send recovery request'));
    expect(await screen.findByText(/Request received/)).toBeTruthy();
    expect(screen.queryByText(/does not exist/i)).toBeNull();
  });
});

describe('verification', () => {
  it('rejects a short or wrong code and continues after the issued code', async () => {
    let pendingId = '';
    const client = {
      ...mockAuthClient,
      register: async (input: Parameters<AuthClient['register']>[0]) => {
        const result = await mockAuthClient.register(input);
        if (result.ok && 'pendingId' in result.value) pendingId = result.value.pendingId;
        return result;
      },
    } satisfies AuthClient;

    function Flow() {
      const { phase, register } = useAuth();
      return (
        <>
          <Text testID="phase">{phase.kind}</Text>
          {phase.kind === 'verify' ? <VerificationScreen /> : (
            <Pressable
              accessibilityLabel="begin"
              onPress={() => void register({
                name: 'Ada Parent',
                identifier: 'parent@example.com',
                password: 'Storybook1',
                acceptedTerms: true,
              })}
            />
          )}
        </>
      );
    }

    await renderAuth(<Flow />, client);
    await fireEvent.press(screen.getByLabelText('begin'));
    expect(await screen.findByText('Confirm the account')).toBeTruthy();
    expect(screen.getByText(/parent@example.com/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(screen.getByText('That code did not match. Try again.')).toBeTruthy();
    const issued = readDevVerificationCode(pendingId);
    if (!issued) throw new Error('expected a verification code');
    await fireEvent.changeText(screen.getByLabelText('Verification code'), issued === '000000' ? '111111' : '000000');
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Verification code'), issued);
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(await screen.findByText('chooseChild')).toBeTruthy();
  });
});

describe('child profiles and the grown-up check', () => {
  it('selects a nickname profile', async () => {
    const registered = await mockAuthClient.register({
      name: 'Ada Parent',
      identifier: 'parent@example.com',
      password: 'Storybook1',
      acceptedTerms: true,
    });
    if (!registered.ok || !('pendingId' in registered.value)) throw new Error('expected verification');
    const verified = await mockAuthClient.verify({
      pendingId: registered.value.pendingId,
      code: readDevVerificationCode(registered.value.pendingId) ?? '',
    });
    if (!verified.ok) throw new Error('expected session');
    await mockAuthClient.createChild({
      accessToken: verified.value.accessToken,
      nickname: 'Sunny',
      ageBand: '5-6',
      avatar: 'lion',
    });
    await writeSession({
      accessToken: verified.value.accessToken,
      refreshToken: verified.value.refreshToken,
      expiresAt: verified.value.expiresAt,
      parentId: verified.value.parent.id,
      parentName: verified.value.parent.name,
      selectedChildId: null,
    });
    function Profiles() {
      const { phase } = useAuth();
      return (
        <>
          <Text testID="phase">{phase.kind}</Text>
          <ChildProfilesScreen />
        </>
      );
    }
    await renderAuth(<Profiles />);
    expect(await screen.findByText('chooseChild')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Sunny. Ages 5–6'));
    await fireEvent.press(screen.getByLabelText('Continue learning'));
    expect(await screen.findByText('ready')).toBeTruthy();
  });

  it('keeps settings locked until the grown-up question is answered', async () => {
    const onUnlock = jest.fn();
    await renderAuth(<ParentGateScreen onUnlock={onUnlock} />);
    const field = screen.getByLabelText(/What is (\d+) \+ (\d+)/);
    await fireEvent.changeText(field, '0');
    await fireEvent.press(screen.getByLabelText('Continue'));
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    const next = /What is (\d+) \+ (\d+)/.exec(screen.getByLabelText(/What is/).props.accessibilityLabel);
    if (!next) throw new Error('missing question');
    await fireEvent.changeText(screen.getByLabelText(/What is/), String(Number(next[1]) + Number(next[2])));
    await fireEvent.press(screen.getByLabelText('Continue'));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
