import { Link } from 'react-router-dom';
import colors from '../theme/colors';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: colors.bg,
  },

  card: {
    width: '100%',
    maxWidth: 560,
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
  },

  code: {
    display: 'inline-block',
    padding: '7px 14px',
    marginBottom: 20,
    borderRadius: 20,
    background: '#eef3ff',
    color: colors.primary,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },

  icon: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    borderRadius: 16,
    background: '#eef3ff',
    color: colors.primary,
    fontSize: 30,
    fontWeight: 700,
  },

  title: {
    margin: 0,
    color: colors.text,
    fontSize: 34,
    fontWeight: 700,
  },

  description: {
    maxWidth: 440,
    margin: '16px auto 0',
    color: colors.muted,
    fontSize: 15,
    lineHeight: 1.6,
  },

  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 30,
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 18px',
    borderRadius: 8,
    background: colors.primary,
    color: colors.white,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 18px',
    borderRadius: 8,
    background: colors.white,
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },

  footer: {
    marginTop: 30,
    marginBottom: 0,
    color: colors.muted,
    fontSize: 12,
  },
};

export default function ErrorPage({
  code,
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  footer = 'SecureShift Administrative Console',
}) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.code}>{code}</div>

        <div style={styles.icon} aria-hidden="true">
          {icon}
        </div>

        <h1 style={styles.title}>{title}</h1>

        <p style={styles.description}>{description}</p>

        <div style={styles.actions}>
          {primaryAction && (
            <Link to={primaryAction.to} style={styles.primaryButton}>
              {primaryAction.label}
            </Link>
          )}

          {secondaryAction && (
            <Link to={secondaryAction.to} style={styles.secondaryButton}>
              {secondaryAction.label}
            </Link>
          )}
        </div>

        <p style={styles.footer}>{footer}</p>
      </section>
    </main>
  );
}
