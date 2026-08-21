import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { getToken, isAuthenticated, isAdmin } from '../utils/authentication';

jest.mock('../utils/authentication', () => ({
  getToken: jest.fn(),
  isAuthenticated: jest.fn(),
  isAdmin: jest.fn(),
}));

function renderProtectedRoute() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/access-denied" element={<div>Access Denied Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Dashboard Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when no token exists', () => {
    getToken.mockReturnValue(null);

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects to /access-denied when the token is invalid or expired', () => {
    getToken.mockReturnValue('some-token');
    isAuthenticated.mockReturnValue(false);

    renderProtectedRoute();

    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
  });

  it('redirects to /access-denied when authenticated but not an admin', () => {
    getToken.mockReturnValue('some-token');
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);

    renderProtectedRoute();

    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
  });

  it('renders the protected content for an authenticated admin', () => {
    getToken.mockReturnValue('some-token');
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(true);

    renderProtectedRoute();

    expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
