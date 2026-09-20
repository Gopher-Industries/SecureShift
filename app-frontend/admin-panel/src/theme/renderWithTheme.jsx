import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

export function renderWithTheme(ui, options) {
  return render(<ThemeProvider>{ui}</ThemeProvider>, options);
}
