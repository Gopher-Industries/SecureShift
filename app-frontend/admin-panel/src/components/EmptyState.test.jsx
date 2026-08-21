import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders default title and icon when no props are given', () => {
    render(<EmptyState />);

    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders a custom title, icon, and message', () => {
    render(
      <EmptyState icon="🔍" title="No users found" message="Try adjusting your filters." />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });

  it('does not render a message when none is provided', () => {
    render(<EmptyState title="No branches yet" />);

    expect(screen.getByText('No branches yet')).toBeInTheDocument();
    expect(screen.queryByText('Try adjusting your filters.')).not.toBeInTheDocument();
  });

  it('renders an action button when actionLabel and onAction are both provided', async () => {
    const onAction = jest.fn();
    render(
      <EmptyState title="No branches yet" actionLabel="Add branch" onAction={onAction} />
    );

    const button = screen.getByRole('button', { name: 'Add branch' });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when actionLabel is missing', () => {
    render(<EmptyState title="No branches yet" onAction={jest.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render an action button when onAction is missing', () => {
    render(<EmptyState title="No branches yet" actionLabel="Add branch" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});