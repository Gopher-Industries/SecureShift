import { render, screen } from '@testing-library/react';
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
});
