import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserDetails from './UserDetails';
import { deleteUser, getUser } from '../service/adminAPI';
import { renderWithTheme } from '../theme/renderWithTheme';

jest.mock('../service/adminAPI', () => ({
  getUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const mockGetUser = getUser;
const mockDeleteUser = deleteUser;

describe('UserDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a user profile and deletes it after confirmation', async () => {
    mockGetUser.mockResolvedValue({
      user: {
        _id: 'user-123',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'guard',
        phone: '+1-555-1234',
        address: '10 Downing Street',
        createdAt: '2024-01-02T10:11:12.000Z',
        updatedAt: '2024-02-03T10:11:12.000Z',
      },
    });
    mockDeleteUser.mockResolvedValue({ message: 'User deleted successfully.' });

    renderWithTheme(
      <MemoryRouter initialEntries={['/users/user-123']}>
        <Routes>
          <Route path="/users/:id" element={<UserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /delete user/i }));

    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith('user-123'));
  });

  it('does not delete the user when the confirmation dialog is cancelled', async () => {
    mockGetUser.mockResolvedValue({
      user: {
        _id: 'user-123',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'guard',
        phone: '+1-555-1234',
        address: '10 Downing Street',
        createdAt: '2024-01-02T10:11:12.000Z',
        updatedAt: '2024-02-03T10:11:12.000Z',
      },
    });

    renderWithTheme(
      <MemoryRouter initialEntries={['/users/user-123']}>
        <Routes>
          <Route path="/users/:id" element={<UserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /delete user/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
