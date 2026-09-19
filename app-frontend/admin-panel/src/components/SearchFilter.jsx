import { useTheme } from '../theme/ThemeProvider';

export default function SearchFilter({ value, onChange, placeholder = 'Search\u2026' }) {
  const { colors } = useTheme();

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '8px 12px',
        border: `1px solid ${colors.borderMuted}`,
        borderRadius: 4,
        marginBottom: 16,
        width: 280,
      }}
    />
  );
}
