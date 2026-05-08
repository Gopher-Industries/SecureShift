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

    expect(await findByText(/Login with your email and password/i)).toBeTruthy();
    expect(await findByPlaceholderText('Enter your email')).toBeTruthy();
    expect(await findByPlaceholderText('Enter your password')).toBeTruthy();
    expect(await findByText('Login')).toBeTruthy();
    expect(await findByText('Sign Up')).toBeTruthy();
  });

  it('shows validation error when fields are empty', async () => {
    const { findByText } = renderLoginScreen();

    fireEvent.press(await findByText('Login'));

    expect(await findByText('Please enter a valid email address.')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid input',
      'Please enter a valid email address.',
    );
  });

  it('shows validation error when password is too short', async () => {
    const { findByPlaceholderText, findByText } = renderLoginScreen();

    fireEvent.changeText(await findByPlaceholderText('Enter your email'), 'guard@test.com');
    fireEvent.changeText(await findByPlaceholderText('Enter your password'), '123');

    fireEvent.press(await findByText('Login'));

    expect(await findByText('Password must be at least 6 characters.')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid input',
      'Password must be at least 6 characters.',
    );
  });

  it('does not navigate when inputs are invalid', async () => {
    const { findByText, navigation } = renderLoginScreen();

    fireEvent.press(await findByText('Login'));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('navigates to signup screen when Sign Up is pressed', async () => {
    const { findByText, navigation } = renderLoginScreen();

    fireEvent.press(await findByText('Sign Up'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('Signup');
    });
  });
});
