import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefreshButton from './RefreshButton';

describe('RefreshButton Component', () => {
  test('renders button with default label', () => {
    render(<RefreshButton onRefresh={jest.fn()} />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('calls onRefresh when clicked', () => {
    const handleRefresh = jest.fn();
    render(<RefreshButton onRefresh={handleRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  test('displays loading state and is disabled while refreshing', () => {
    const handleRefresh = jest.fn();
    render(<RefreshButton onRefresh={handleRefresh} isRefreshing={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleRefresh).not.toHaveBeenCalled();
  });

  test('is disabled when disabled prop is true', () => {
    const handleRefresh = jest.fn();
    render(<RefreshButton onRefresh={handleRefresh} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleRefresh).not.toHaveBeenCalled();
  });

  test('displays last-refreshed timestamp when provided', () => {
    const testDate = new Date('2026-08-15T12:30:00');
    render(<RefreshButton onRefresh={jest.fn()} lastRefreshed={testDate} />);

    expect(screen.getByText(/Last refreshed/i)).toBeInTheDocument();
  });
});
