import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  test('renders the required contact fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeInTheDocument();
  });

  test('shows validation errors when submitted empty', () => {
    render(<ContactForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
  });

  test('shows errors for invalid values', () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'U' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Short' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(
      screen.getByText('Name must be at least 2 characters.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter a valid email address.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Message must be at least 10 characters.')
    ).toBeInTheDocument();
  });

  test('submits valid data and resets the form', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    render(<ContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Ujwal Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ujwal@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: {
        value: 'I would like more information about SecureShift.',
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Ujwal Sharma',
        email: 'ujwal@example.com',
        message: 'I would like more information about SecureShift.',
      });
    });

    expect(
      await screen.findByText(
        'Your message has been submitted successfully.'
      )
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });

  test('shows an error when submission fails', async () => {
    const handleSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Submission failed.'));

    render(<ContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Ujwal Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ujwal@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'This is a valid contact form message.' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(
      await screen.findByText('Submission failed.')
    ).toBeInTheDocument();
  });
});