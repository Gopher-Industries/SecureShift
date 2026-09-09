import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { getUsers, getShifts } from '../service/adminAPI';

jest.mock('../service/adminAPI', () => ({
  getUsers: jest.fn(),
  getShifts: jest.fn(),
}));

function DummyUserDetails() {
  return <div>User details page</div>;
}

function DummyShifts() {
  return <div>Shifts page</div>;
}

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<GlobalSearch />} />
        <Route path="/users/:id" element={<DummyUserDetails />} />
        <Route path="/shifts" element={<DummyShifts />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUsers.mockResolvedValue([
      { _id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'employer' },
      { _id: 'g1', name: 'Grace Hopper', email: 'grace@example.com', role: 'guard' },
    ]);
        getShifts.mockResolvedValue([{ _id: 's1', title: 'Night Watch — Ada Site', status: 'open' }]);
  });

  it('does not search until the minimum query length is reached', async () => {
    renderWithRoutes();
    const input = screen.getByRole('searchbox', { name: /global search/i });

    await userEvent.type(input, 'a');

    await new Promise((r) => setTimeout(r, 350));
    expect(getUsers).not.toHaveBeenCalled();
  });

  it('debounces input and returns grouped cross-entity results', async () => {
    renderWithRoutes();
    const input = screen.getByRole('searchbox', { name: /global search/i });

    await userEvent.type(input, 'ada');

    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    expect(getShifts).toHaveBeenCalledTimes(1);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Night Watch — Ada Site')).toBeInTheDocument();
    // Guard shouldn't match "ada" and shouldn't render.
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
  });

  it('groups guards separately from other users', async () => {
    renderWithRoutes();
    const input = screen.getByRole('searchbox', { name: /global search/i });

    await userEvent.type(input, 'grace');

    expect(await screen.findByText('Guards')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.queryByText(/^Users$/)).not.toBeInTheDocument();
  });

  it('navigates to the user detail page on click', async () => {
    renderWithRoutes();
    const input = screen.getByRole('searchbox', { name: /global search/i });

    await userEvent.type(input, 'ada');
    const result = await screen.findByText('Ada Lovelace');
    await userEvent.click(result);

    expect(await screen.findByText('User details page')).toBeInTheDocument();
  });

  it('navigates to the shifts page pre-filtered by title on click', async () => {
    renderWithRoutes();
    const input = screen.getByRole('searchbox', { name: /global search/i });

    await userEvent.type(input, 'night watch');
    const result = await screen.findByText('Night Watch — Ada Site');
    await userEvent.click(result);

    expect(await screen.findByText('Shifts page')).toBeInTheDocument();
  });
});
