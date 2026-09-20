import { render, screen } from '@testing-library/react';
import ContactUs from './pages/ContactUs';

test('renders the Contact Us page and reusable form', () => {
  render(<ContactUs />);

  expect(
    screen.getByRole('heading', { name: /contact us/i })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('form', { name: /contact form/i })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', { name: /send message/i })
  ).toBeInTheDocument();
});