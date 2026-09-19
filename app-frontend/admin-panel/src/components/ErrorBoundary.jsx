import { Component } from 'react';
import { useTheme } from '../theme/ThemeProvider';

const getStyles = (colors) => ({
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: colors.background,
  },
  card: {
    maxWidth: 420,
    width: '100%',
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 32,
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 1.5,
  },
  button: {
    background: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
});

// Catches render errors anywhere in the child tree and shows a friendly
// fallback instead of a blank white screen.
//
// Usage (once, at the root layout — wrap the routed content, NOT the
// ToastProvider itself, so a render crash still gets a fallback even if
// something upstream is broken):
//   <ErrorBoundary>
//     <AppRoutes />
//   </ErrorBoundary>
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Don't swallow the real error — still log it for debugging.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught a render error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const styles = getStyles(this.props.colors);

    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.title}>Something went wrong</div>
            <div style={styles.message}>
              An unexpected error occurred. Try reloading the page — if the problem continues,
              please contact support.
            </div>
            <button style={styles.button} onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ThemedErrorBoundary({ children }) {
  const { colors } = useTheme();

  return <ErrorBoundary colors={colors}>{children}</ErrorBoundary>;
}
