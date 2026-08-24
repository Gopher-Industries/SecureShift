import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import useAdminAuth from '../hooks/useAdminAuth';

jest.mock('../hooks/useAdminAuth');

const actualRouter = jest.requireActual('react-router-dom');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Exposes the current router location as text, so tests can assert on it.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

describe('AdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login flow', () => {
    beforeEach(() => {
      useNavigate.mockReturnValue(mockNavigate);
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

  describe('session expiry message', () => {
    beforeEach(() => {
      useAdminAuth.mockReturnValue({ login: jest.fn() });
      // Use the REAL useNavigate here so the router actually updates the URL.
      useNavigate.mockImplementation(actualRouter.useNavigate);
    });

    it('shows a session-expired message when redirected with ?sessionExpired=1', async () => {
      render(
        <MemoryRouter initialEntries={['/login?sessionExpired=1']}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    });

    it('shows no session-expired message on a normal visit to /login', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText(/session has expired/i)).not.toBeInTheDocument();
    });

    it('strips the sessionExpired query param from the URL after showing it once', async () => {
      render(
        <MemoryRouter initialEntries={['/login?sessionExpired=1']}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      );

      // Message shows immediately
      await screen.findByText(/session has expired/i);

      // The URL is replaced, so a refresh won't re-trigger it.
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/login');
      });
      expect(screen.getByTestId('location')).not.toHaveTextContent('sessionExpired');
    });
  });
});
