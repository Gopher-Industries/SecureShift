/* eslint-env jest */

import { render } from '@testing-library/react-native';
import React from 'react';

import MessagesScreen from '../../src/screen/MessagesScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../src/api/auth', () => ({
  getMe: jest.fn().mockResolvedValue({ _id: 'me', name: 'Mia', role: 'guard' }),
}));

jest.mock('../../src/api/messages', () => ({
  getInboxMessages: jest.fn().mockResolvedValue([]),
  getSentMessages: jest.fn().mockResolvedValue([]),
  getConversation: jest.fn().mockResolvedValue({ messages: [] }),
  sendMessage: jest.fn(),
}));

import { getMe } from '../../src/api/auth';
import { getInboxMessages } from '../../src/api/messages';

describe('MessagesScreen (smoke)', () => {
  it('renders the messages UI and loads conversations on mount', async () => {
    const { findByText, getByText } = render(
      <ThemeProvider>
        <MessagesScreen />
      </ThemeProvider>,
    );

    expect(await findByText('Messages')).toBeTruthy();
    // General context with no participant selected shows the conversation list.
    expect(getByText('Conversations')).toBeTruthy();
    expect(getByText('Start a new conversation')).toBeTruthy();
    expect(getMe).toHaveBeenCalled();
    expect(getInboxMessages).toHaveBeenCalled();
  });
});
