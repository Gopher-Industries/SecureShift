import { createContext, useCallback, useContext, useRef, useState } from 'react';
import colors from '../theme/colors';

const ToastContext = createContext(null);

const styles = {
  viewport: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: 320,
  },
  toast: (type) => ({
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    color: type === 'error' ? colors.danger : type === 'success' ? colors.success : colors.text,
    background: type === 'error' ? '#fde2e2' : type === 'success' ? '#dcfce7' : colors.card,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }),
};

// Wrap the app (once, at the root layout) so any page can call
// useToast().showToast(...) to pop a temporary notification.
//
// Usage (setup, once):
//   <ToastProvider>
//     <App />
//   </ToastProvider>
//
// Usage (in a page):
//   const { showToast } = useToast();
//   showToast('Settings saved.', 'success');
//   showToast('Failed to save settings', 'error');
export function ToastProvider({ children, duration = 3000 }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [duration]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.viewport}>
        {toasts.map((t) => (
          <div key={t.id} style={styles.toast(t.type)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
