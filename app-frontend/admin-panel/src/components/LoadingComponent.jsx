import { useTheme } from '../theme/ThemeProvider';

export default function LoadingComponent({ label = 'Loading\u2026' }) {
  const { colors } = useTheme();
  return <p style={{ color: colors.muted }}>{label}</p>;
}
