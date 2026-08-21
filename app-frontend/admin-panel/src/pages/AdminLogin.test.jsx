import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import useAdminAuth from '../hooks/useAdminAuth';

jest.mock('../hooks/useAdminAuth');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in successfully and redirects to the dashboard', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ token: 'abc', role: 'admin' });
    useAdminAuth.mockReturnValue({ login: mockLogin });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin.local@secureshift.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'SecureShift1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('admin.local@secureshift.test', 'SecureShift1!')
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    );
  });

  it('shows an error message when login fails', async () => {
    const mockLogin = jest.fn().mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    useAdminAuth.mockReturnValue({ login: mockLogin });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit button while the login request is in flight', async () => {
    let resolveLogin;
    const mockLogin = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );
    useAdminAuth.mockReturnValue({ login: mockLogin });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin.local@secureshift.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'SecureShift1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    resolveLogin({ token: 'abc', role: 'admin' });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });
});

