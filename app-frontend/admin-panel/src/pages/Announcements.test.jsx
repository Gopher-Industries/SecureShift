import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Announcements from './Announcements';

describe('Announcements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the selected audience in the confirmation dialog', async () => {
    render(<Announcements />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Test Announcement');
    await userEvent.type(screen.getByLabelText(/message/i), 'This is a test.');
    await userEvent.selectOptions(screen.getByLabelText(/audience/i), 'active');

    await userEvent.click(screen.getByRole('button', { name: /send announcement/i }));

    const dialog = screen.getByRole('dialog', { name: /confirm announcement/i });
    expect(dialog).toHaveTextContent('Test Announcement');
    expect(dialog).toHaveTextContent('Active Guards Only');
  });

  it('records a completed mock send in the history and resets the form', async () => {
    render(<Announcements />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Test Announcement');
    await userEvent.type(screen.getByLabelText(/message/i), 'This is a test.');

    await userEvent.click(screen.getByRole('button', { name: /send announcement/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, send to/i }));

    expect(await screen.findByText('Test Announcement')).toBeInTheDocument();
    expect(screen.getByText('This is a test.')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });
});
