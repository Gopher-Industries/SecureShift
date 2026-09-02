import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Roles from './Roles';
import { ToastProvider } from '../components/Toast';
import { __resetRolesStore } from '../service/rolesAPI';

const renderRoles = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <Roles />
      </ToastProvider>
    </MemoryRouter>
  );

describe('Roles & Permissions page', () => {
  beforeEach(() => {
    __resetRolesStore();
  });

  it('lists the seeded roles with permission summaries', async () => {
    renderRoles();

    expect(await screen.findByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();

    // super_admin's wildcard renders as full access, not a count
    expect(screen.getByText('Full access (all permissions)')).toBeInTheDocument();
    // guard is seeded with three permissions
    const guardRow = screen.getByText('Guard').closest('tr');
    expect(within(guardRow).getByText('3 permissions')).toBeInTheDocument();
  });

  it('edits and persists a role’s permissions through the dialog', async () => {
    renderRoles();

    await screen.findByText('Guard');
    const guardRow = screen.getByText('Guard').closest('tr');
    fireEvent.click(within(guardRow).getByRole('button', { name: /edit permissions/i }));

    const dialog = await screen.findByRole('dialog', { name: /edit guard permissions/i });
    const checkbox = within(dialog).getByLabelText(/shift:write/);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    // dialog closes, success toast appears
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /edit guard permissions/i })
      ).not.toBeInTheDocument()
    );
    expect(await screen.findByText(/permissions updated for guard/i)).toBeInTheDocument();

    // guard now has four permissions (persisted in the store)
    const updatedRow = screen.getByText('Guard').closest('tr');
    expect(within(updatedRow).getByText('4 permissions')).toBeInTheDocument();
  });

  it('does not allow editing the super_admin wildcard role', async () => {
    renderRoles();

    await screen.findByText('Super Admin');
    const row = screen.getByText('Super Admin').closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: /edit permissions/i }));

    const dialog = await screen.findByRole('dialog', { name: /edit super admin permissions/i });
    expect(within(dialog).getByRole('button', { name: /save changes/i })).toBeDisabled();
    // every permission checkbox is checked + disabled for the wildcard role
    const checkboxes = within(dialog).getAllByRole('checkbox');
    checkboxes.forEach((box) => {
      expect(box).toBeChecked();
      expect(box).toBeDisabled();
    });
  });
});
