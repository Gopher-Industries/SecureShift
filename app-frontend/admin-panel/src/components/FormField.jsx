import colors from '../theme/colors';

const styles = {
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 14,
    color: colors.text,
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
  },
  inputError: {
    borderColor: colors.danger,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
};

// Reusable label + input + hint/error combo, used across admin-panel forms
// (login, SMTP settings, branch/user forms, etc.) so field markup stays
// consistent instead of being hand-rolled per page.
//
// Usage:
//   <FormField
//     id="smtp-host"
//     label="Host"
//     value={settings.SMTP_HOST}
//     onChange={handleChange('SMTP_HOST')}
//     error={fieldErrors.SMTP_HOST}
//     hint="e.g. smtp.gmail.com"
//   />
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  error,
  required = false,
  as = 'input', // 'input' | 'select' | 'textarea'
  children, // <option> elements when as="select"
  ...rest
}) {
  const inputStyle = { ...styles.input, ...(error ? styles.inputError : {}) };

  return (
    <div style={styles.field}>
      <label style={styles.label} htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>

      {as === 'select' ? (
        <select id={id} style={inputStyle} value={value} onChange={onChange} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={id}
          style={inputStyle}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          style={inputStyle}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {error ? (
        <p style={styles.error}>{error}</p>
      ) : hint ? (
        <p style={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
