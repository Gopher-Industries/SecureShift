import Modal from './Modal';
import { useTheme } from '../theme/ThemeProvider';

// Confirmation prompt for risky/destructive actions (delete user, remove
// branch, etc.) — wraps the existing Modal component so it matches the
// same open/close behaviour app-wide.
//

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  const styles = {
    message: { color: colors.text, fontSize: 14, margin: '4px 0 20px' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
    cancelButton: {
      background: colors.card,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: 6,
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
    },
    confirmButton: (danger) => ({
      background: danger ? colors.danger : colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: 6,
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
    }),
  };

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      {message && <p style={styles.message}>{message}</p>}
      <div style={styles.actions}>
        <button type="button" style={styles.cancelButton} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" style={styles.confirmButton(danger)} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
