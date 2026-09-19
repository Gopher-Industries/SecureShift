// Shared SecureShift palette — aligned with the Guard App (#274289) and Employer Panel (#274b93).

// To use colors, make sure to import useTheme from ThemeProvider and have
// "const { colors } = useTheme();" inside any function that uses colors
const shared = {
  borderMuted: '#ccc',
  successBg: '#dcfce7',
  warning: '#854f0b',
  warningBg: '#fef3c7',
  warningBorder: '#f1c66d',
  danger: '#b00020',
  dangerBg: '#fee2e2',
  dangerBorder: '#e0a0a0',
  expired: '#374151',
  expiredBg: '#e5e7eb',
  selected: '#eef6ff',
  white: '#fff',
  purple: '#7656b5',
  amber: '#d28b0b',
  blue: '#0065c9',
  black: '#000',
};

const light = {
  ...shared,
  primary: '#274b93', // brand blue (buttons, links, active nav)
  primaryDark: '#18284f', // sidebar / dark surfaces
  primaryDeep: '#072261', // deepest navy accent
  loginBg: '#072261', // behind logo
  bg: '#f3f4f6', // app background
  card: '#fff',
  text: '#111827',
  muted: '#6b7280',
  mutedLight: '#999',
  mutedDark: '#374151',
  border: '#e5e7eb',
  tableHead: '#f3f4f6',
  success: '#107837',
  error: '#b00020',
};

const dark = {
  ...shared,
  primary: '#688ad0', // brand blue (buttons, links, active nav)
  primaryDark: '#29374d', // sidebar / dark surfaces
  primaryDeep: '#608ffc', // deepest navy accent
  loginBg: '#131d2a', // behind logo
  bg: '#111827', // app background
  card: '#1f2937',
  text: '#f9fafb',
  muted: '#8a8a8a',
  mutedLight: '#a0a0a0',
  mutedDark: '#8a92a4',
  border: '#374151',
  tableHead: '#111827',
  success: '#16a34a',
  error: '#ff4f53',
};

export const modes = {
  light,
  dark,
};

// Temporary compatibility export while converting components
const colors = {
  ...light,
};

export default colors;
