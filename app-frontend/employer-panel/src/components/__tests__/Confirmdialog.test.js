import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ConfirmDialog from '../Confirmdialog';

test('renders nothing when isOpen is false', () => {
  const { container } = render(
    <ConfirmDialog isOpen={false} title="Delete?" onConfirm={jest.fn()} onCancel={jest.fn()} />
  );
  expect(container).toBeEmptyDOMElement();
});

test('shows the title, message and custom button labels', () => {
  render(
    <ConfirmDialog
      isOpen
      title="Delete shift?"
      message="This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Keep shift"
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
    />
  );

  expect(screen.getByText('Delete shift?')).toBeInTheDocument();
  expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Keep shift' })).toBeInTheDocument();
});

test('calls onConfirm exactly once, even on a rapid double-click', () => {
  const onConfirm = jest.fn();
  render(
    <ConfirmDialog
      isOpen
      title="Delete shift?"
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={jest.fn()}
    />
  );

  const confirmBtn = screen.getByRole('button', { name: 'Delete' });
  fireEvent.click(confirmBtn);
  fireEvent.click(confirmBtn);

  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('disables both buttons and shows a working state while busy', () => {
  render(
    <ConfirmDialog
      isOpen
      title="Delete shift?"
      confirmLabel="Delete"
      busy
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
    />
  );

  expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
});

test('calls onCancel when Cancel is clicked', () => {
  const onCancel = jest.fn();
  render(<ConfirmDialog isOpen title="Delete shift?" onConfirm={jest.fn()} onCancel={onCancel} />);

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('calls onCancel when the backdrop is clicked', () => {
  const onCancel = jest.fn();
  const { container } = render(
    <ConfirmDialog isOpen title="Delete shift?" onConfirm={jest.fn()} onCancel={onCancel} />
  );

  fireEvent.mouseDown(container.querySelector('.cd-backdrop'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('calls onCancel when Escape is pressed', () => {
  const onCancel = jest.fn();
  render(<ConfirmDialog isOpen title="Delete shift?" onConfirm={jest.fn()} onCancel={onCancel} />);

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('ignores Escape and backdrop clicks while busy', () => {
  const onCancel = jest.fn();
  const { container } = render(
    <ConfirmDialog isOpen title="Delete shift?" busy onConfirm={jest.fn()} onCancel={onCancel} />
  );

  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.mouseDown(container.querySelector('.cd-backdrop'));
  expect(onCancel).not.toHaveBeenCalled();
});
