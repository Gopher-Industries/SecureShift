/* eslint-env jest */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import LoginScreen from '../src/screen/loginscreen';
import { ThemeProvider } from '../src/theme/ThemeProvider';

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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
});
