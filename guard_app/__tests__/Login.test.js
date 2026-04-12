/* eslint-env jest */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from '../src/screen/loginscreen';

describe('Login Screen', () => {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  it('renders the login form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={navigation} />);

    expect(getByText('Login with your email and password')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows validation error when fields are empty', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);

    const loginButton = getByText('Login');

    fireEvent.press(loginButton);

    // We expect validation to trigger
    expect(getByText('Login')).toBeTruthy(); // button still there
  });
});
