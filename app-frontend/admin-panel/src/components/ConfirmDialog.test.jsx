import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        message="Delete this user?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('Delete this user?')).not.toBeInTheDocument();
  });

  it('renders the title, message, and default button labels when open', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete User"
        message="This action cannot be undone."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        open={true}
        message="Delete this user?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open={true}
        message="Delete this user?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses custom confirm/cancel labels when provided', () => {
    render(
      <ConfirmDialog
        open={true}
        message="Reject this guard's license?"
        confirmLabel="Reject"
        cancelLabel="Go back"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });
});
