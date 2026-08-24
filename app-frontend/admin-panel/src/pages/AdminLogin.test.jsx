import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import AdminLogin from './AdminLogin';

// Exposes the current router location as text, so tests can assert on it.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

describe('AdminLogin', () => {
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
