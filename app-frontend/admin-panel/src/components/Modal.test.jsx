import { act, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('uses a unique title id for each concurrently mounted modal', () => {
    render(
      <>
        <Modal open={true} title="First modal" onClose={jest.fn()}>
          First modal content
        </Modal>
        <Modal open={true} title="Second modal" onClose={jest.fn()}>
          Second modal content
        </Modal>
      </>
    );

    const firstDialog = screen.getByRole('dialog', { name: 'First modal' });
    const secondDialog = screen.getByRole('dialog', { name: 'Second modal' });
    const firstHeading = screen.getByRole('heading', { name: 'First modal', level: 3 });
    const secondHeading = screen.getByRole('heading', { name: 'Second modal', level: 3 });

    expect(firstHeading).toHaveAttribute('id');
    expect(secondHeading).toHaveAttribute('id');
    expect(firstHeading.id).not.toBe(secondHeading.id);
    expect(firstDialog).toHaveAttribute('aria-labelledby', firstHeading.id);
    expect(secondDialog).toHaveAttribute('aria-labelledby', secondHeading.id);
  });

  it('does not re-steal focus when the parent re-renders with a new inline onClose', async () => {
    jest.useFakeTimers();

    function Wrapper() {
      const [, forceRerender] = useState(0);

      useEffect(() => {
        const interval = setInterval(() => forceRerender((n) => n + 1), 1000);
        return () => clearInterval(interval);
      }, []);

      return (
        <Modal open={true} title="Test modal" onClose={() => {}}>
          <input aria-label="second field" />
          <button>Confirm</button>
        </Modal>
      );
    }

    render(<Wrapper />);

    const secondField = screen.getByLabelText('second field');
    secondField.focus();
    expect(secondField).toHaveFocus();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(secondField).toHaveFocus();

    jest.useRealTimers();
  });

  it('restores focus to the previously-focused element on close', () => {
    function Wrapper() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open modal</button>
          <Modal open={open} title="Test modal" onClose={() => setOpen(false)}>
            <button>Inside modal</button>
          </Modal>
        </>
      );
    }

    render(<Wrapper />);

    const openButton = screen.getByRole('button', { name: /open modal/i });
    openButton.focus();
    expect(openButton).toHaveFocus();

    userEvent.click(openButton);
  });
});
