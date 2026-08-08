import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  test('renders initial form fields and accessible submit button', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeInTheDocument();
  });

  test('shows required field validation errors when submitted empty', () => {
    render(<ContactForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Subject is required.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'contact-name-error');
  });

  test('validates invalid email format', () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(
      screen.getByText('Enter a valid email address.')
    ).toBeInTheDocument();
  });

  test('validates phone number when provided', () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: 'abc-invalid-phone' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(
      screen.getByText('Enter a valid phone number.')
    ).toBeInTheDocument();
  });

  test('updates character counter on typing message', () => {
    render(<ContactForm />);

    const messageInput = screen.getByLabelText(/message/i);
    expect(screen.getByText('0/1000')).toBeInTheDocument();

    fireEvent.change(messageInput, {
      target: { value: 'Hello World' },
    });

    expect(screen.getByText('11/1000')).toBeInTheDocument();
  });

  test('handles loading state: disables submit button and inputs, shows spinner', async () => {
    let resolveSubmit;
    const handleSubmit = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
    );

    render(<ContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Alex Mercer' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'General Inquiry' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Checking loading state and disabled inputs.' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    // During loading:
    const submitBtn = screen.getByRole('button', { name: /sending\.\.\./i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
    expect(screen.getByLabelText(/subject/i)).toBeDisabled();
    expect(screen.getByLabelText(/message/i)).toBeDisabled();

    // Prevent duplicate submissions while loading:
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);

    // Success message is NOT shown yet
    expect(
      screen.queryByText('Your message has been submitted successfully.')
    ).not.toBeInTheDocument();

    // Resolve submission
    resolveSubmit();

    await waitFor(() => {
      expect(
        screen.getByText('Your message has been submitted successfully.')
      ).toBeInTheDocument();
    });

    // Inputs enabled again after submission completes
    expect(screen.getByLabelText(/name/i)).not.toBeDisabled();
  });

  test('displays error message on failed submission', async () => {
    const handleSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Server error occurred.'));

    render(<ContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Alex Mercer' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Feedback' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Testing error message banner display.' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Server error occurred.');
  });
});