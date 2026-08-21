import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from './FormField';

describe('FormField', () => {
  it('renders a label and input, and calls onChange when typed into', async () => {
    const onChange = jest.fn();
    render(<FormField id="smtp-host" label="Host" value="" onChange={onChange} />);

    const input = screen.getByLabelText('Host');
    expect(input).toBeInTheDocument();

    await userEvent.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('appends an asterisk to the label when required is true', () => {
    render(<FormField id="email" label="Email" value="" onChange={jest.fn()} required />);

    expect(screen.getByText('Email *')).toBeInTheDocument();
  });

  it('shows the hint text when no error is present', () => {
    render(
      <FormField
        id="smtp-host"
        label="Host"
        value=""
        onChange={jest.fn()}
        hint="e.g. smtp.gmail.com"
      />
    );

    expect(screen.getByText('e.g. smtp.gmail.com')).toBeInTheDocument();
  });

  it('shows the error text instead of the hint when both are present', () => {
    render(
      <FormField
        id="smtp-host"
        label="Host"
        value=""
        onChange={jest.fn()}
        hint="e.g. smtp.gmail.com"
        error="Host is required"
      />
    );

    expect(screen.getByText('Host is required')).toBeInTheDocument();
    expect(screen.queryByText('e.g. smtp.gmail.com')).not.toBeInTheDocument();
  });

  it('renders a select with its children when as="select"', () => {
    render(
      <FormField id="role" label="Role" value="admin" onChange={jest.fn()} as="select">
        <option value="admin">Admin</option>
        <option value="guard">Guard</option>
      </FormField>
    );

    const select = screen.getByLabelText('Role');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Guard' })).toBeInTheDocument();
  });

  it('renders a textarea when as="textarea"', () => {
    render(<FormField id="notes" label="Notes" value="" onChange={jest.fn()} as="textarea" />);

    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
  });
});
