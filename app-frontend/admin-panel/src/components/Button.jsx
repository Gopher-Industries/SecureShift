import colors from '../theme/colors';

// Reusable button matching the Employer Panel's pill-shaped button style
// (see app-frontend/employer-panel/src/pages/Login.css — .loginButton / .secondaryButton).
//
// Usage:
//   <Button onClick={handleSave}>Save</Button>
//   <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
//   <Button variant="danger" onClick={handleDelete}>Delete</Button>

const base = {
  border: 'none',
  borderRadius: 80,
  padding: '10px 20px',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const variants = {
  primary: {
    background: colors.primaryDeep,
    color: colors.white,
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: colors.primaryDeep,
    border: `1px solid ${colors.primaryDeep}`,
  },
  danger: {
    background: colors.danger,
    color: colors.white,
    border: 'none',
  },
};

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  style,
  ...rest
}) {
  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}