/* eslint-env jest */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { login as apiLogin, verifyOtp as apiVerifyOtp, getMe } from '../src/api/auth';
import { LocalStorage } from '../src/lib/localStorage';
import LoginScreen from '../src/screen/loginscreen';
import { ThemeProvider } from '../src/theme/ThemeProvider';

jest.mock('../src/api/auth', () => ({
  login: jest.fn(),
  verifyOtp: jest.fn(),
  getMe: jest.fn(),
}));

jest.mock('../src/lib/pushNotifications', () => ({
  registerPushTokenIfNeeded: jest.fn().mockResolvedValue(undefined),
}));

describe('Login Screen', () => {
  const renderLoginScreen = () => {
    const navigation = {
      navigate: jest.fn(),
      reset: jest.fn(),
    };

    return {
      ...render(
        <ThemeProvider>
          <LoginScreen navigation={navigation} />
        </ThemeProvider>,
      ),
      navigation,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await LocalStorage.clearAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the login form correctly', async () => {
    const { findByPlaceholderText, findByText } = renderLoginScreen();

    // After mocking i18next, t(key) returns the key name
    expect(await findByText('login.title')).toBeTruthy();
    expect(await findByPlaceholderText('login.emailPlaceholder')).toBeTruthy();
    expect(await findByPlaceholderText('login.passwordPlaceholder')).toBeTruthy();
    expect(await findByText('login.button')).toBeTruthy();
    expect(await findByText('login.signupLink')).toBeTruthy();
  });

  it('shows validation error when fields are empty', async () => {
    const { findByText } = renderLoginScreen();

    fireEvent.press(await findByText('login.button'));

    // In the code, validation returns t('err.invalidEmail')
    expect(Alert.alert).toHaveBeenCalledWith('login.invalidInput', 'err.invalidEmail');
  });

  it('shows validation error when password is too short', async () => {
    const { findByPlaceholderText, findByText } = renderLoginScreen();

    fireEvent.changeText(await findByPlaceholderText('login.emailPlaceholder'), 'guard@test.com');
    fireEvent.changeText(await findByPlaceholderText('login.passwordPlaceholder'), '123');

    fireEvent.press(await findByText('login.button'));

    // In the code, validation returns t('err.shortPassword')
    expect(Alert.alert).toHaveBeenCalledWith('login.invalidInput', 'err.shortPassword');
  });

  it('does not navigate when inputs are invalid', async () => {
    const { findByText, navigation } = renderLoginScreen();

    fireEvent.press(await findByText('login.button'));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('navigates to signup screen when Sign Up is pressed', async () => {
    const { findByText, navigation } = renderLoginScreen();

    fireEvent.press(await findByText('login.signupLink'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('Signup');
    });
  });

  const submitValidCredentials = async ({ findByPlaceholderText, findByText }) => {
    fireEvent.changeText(await findByPlaceholderText('login.emailPlaceholder'), 'guard@test.com');
    fireEvent.changeText(await findByPlaceholderText('login.passwordPlaceholder'), 'password1');
    fireEvent.press(await findByText('login.button'));
  };

  describe('session establishment (API mocked)', () => {
    it('stores the token and enters the app when the API returns a token immediately', async () => {
      apiLogin.mockResolvedValue({ token: 'jwt-token-1', role: 'guard', id: 'g1' });

      const screen = renderLoginScreen();
      await submitValidCredentials(screen);

      await waitFor(() => {
        expect(screen.navigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'AppTabs' }],
        });
      });

      expect(apiLogin).toHaveBeenCalledWith({ email: 'guard@test.com', password: 'password1' });
      expect(await LocalStorage.getToken()).toBe('jwt-token-1');
    });

    it('shows the login-failed alert and does not navigate when the API rejects', async () => {
      apiLogin.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

      const screen = renderLoginScreen();
      await submitValidCredentials(screen);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('login.loginFailed', 'Invalid credentials');
      });

      expect(screen.navigation.reset).not.toHaveBeenCalled();
      expect(await LocalStorage.getToken()).toBeNull();
    });

    it('switches to OTP mode when the API accepts credentials but withholds a token', async () => {
      apiLogin.mockResolvedValue({ token: null, role: null, id: null });

      const screen = renderLoginScreen();
      await submitValidCredentials(screen);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('login.otpRequired', 'login.otpMsg');
      });

      expect(await screen.findByText('login.verifyOtp')).toBeTruthy();
      expect(screen.navigation.reset).not.toHaveBeenCalled();
    });

    it('verifies the OTP, stores the new token, and enters the app for a verified license', async () => {
      apiLogin.mockResolvedValue({ token: null, role: null, id: null });
      apiVerifyOtp.mockResolvedValue({ token: 'jwt-token-2' });
      getMe.mockResolvedValue({ license: { status: 'verified' } });

      const screen = renderLoginScreen();
      await submitValidCredentials(screen);
      await screen.findByText('login.verifyOtp');

      fireEvent.changeText(await screen.findByPlaceholderText('123456'), '000111');
      fireEvent.press(await screen.findByText('login.verifyOtp'));

      await waitFor(() => {
        expect(screen.navigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'AppTabs' }],
        });
      });

      expect(apiVerifyOtp).toHaveBeenCalledWith({ email: 'guard@test.com', otp: '000111' });
      expect(await LocalStorage.getToken()).toBe('jwt-token-2');
    });

    it('blocks entry and explains the reason when the license was rejected', async () => {
      apiLogin.mockResolvedValue({ token: null, role: null, id: null });
      apiVerifyOtp.mockResolvedValue({ token: 'jwt-token-3' });
      getMe.mockResolvedValue({ license: { status: 'rejected', rejectionReason: 'Expired ID' } });

      const screen = renderLoginScreen();
      await submitValidCredentials(screen);
      await screen.findByText('login.verifyOtp');

      fireEvent.changeText(await screen.findByPlaceholderText('123456'), '000111');
      fireEvent.press(await screen.findByText('login.verifyOtp'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'License Rejected',
          expect.stringContaining('Expired ID'),
        );
      });

      expect(screen.navigation.reset).not.toHaveBeenCalled();
    });
  });
});
