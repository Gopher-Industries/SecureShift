import Modal from './Modal';
import colors from '../theme/colors';

const styles = {
  message: { color: colors.text, fontSize: 14, margin: '4px 0 20px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelButton: (disabled) => ({
    background: colors.white,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }),
  confirmButton: (danger, disabled) => ({
    background: danger ? colors.danger : colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }),
};

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
  confirmDisabled = false,
  cancelDisabled = false,
  children,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      {message && <p style={styles.message}>{message}</p>}
      {children}
      <div style={styles.actions}>
        <button
          type="button"
          style={styles.cancelButton(cancelDisabled)}
          onClick={onCancel}
          disabled={cancelDisabled}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          style={styles.confirmButton(danger, confirmDisabled)}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
