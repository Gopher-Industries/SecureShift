import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

const modalWithFocusTarget = (onClose) => (
  <Modal open={true} title="Focus test" onClose={onClose}>
    <button type="button">First action</button>
    <input aria-label="Keep focus" />
  </Modal>
);

describe('Modal focus management', () => {
  it('does not re-steal focus when an open parent supplies a new onClose function', () => {
    const firstOnClose = jest.fn();
    const latestOnClose = jest.fn();
    const { rerender } = render(modalWithFocusTarget(firstOnClose));
    const focusTarget = screen.getByRole('textbox', { name: 'Keep focus' });

    focusTarget.focus();
    expect(focusTarget).toHaveFocus();

    rerender(modalWithFocusTarget(latestOnClose));

    expect(focusTarget).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(latestOnClose).toHaveBeenCalledTimes(1);
    expect(firstOnClose).not.toHaveBeenCalled();
  });

  it('restores focus to the previously focused element when the modal closes', () => {
    const onClose = jest.fn();
    const renderModal = (open) => (
      <>
        <button type="button">Open modal</button>
        <Modal open={open} title="Restore focus" onClose={onClose}>
          <button type="button">First action</button>
        </Modal>
      </>
    );
    const { rerender } = render(renderModal(false));
    const trigger = screen.getByRole('button', { name: 'Open modal' });

    trigger.focus();
    rerender(renderModal(true));
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();

    rerender(renderModal(false));
    expect(trigger).toHaveFocus();
  });

  it('continues to trap tab focus within the open modal', () => {
    render(
      <Modal open={true} title="Focus trap" onClose={jest.fn()}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Modal>
    );

    const first = screen.getByRole('button', { name: 'First action' });
    const last = screen.getByRole('button', { name: 'Last action' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});
