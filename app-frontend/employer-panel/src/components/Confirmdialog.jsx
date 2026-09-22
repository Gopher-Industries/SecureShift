import React, { useEffect, useRef } from 'react';
import './Confirmdialog.css';

/**
 * Reusable confirmation dialog for critical or destructive actions
 * (deleting records, removing/unassigning guards, status changes, etc).
 *
 * Usage:
 *   <ConfirmDialog
 *     isOpen={!!pendingAction}
 *     title="Delete this shift?"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     tone="danger"
 *     busy={deleting}
 *     onConfirm={handleConfirmDelete}
 *     onCancel={() => setPendingAction(null)}
 *   />
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  // Guards against a confirm firing twice (double-click / double Enter)
  // before the parent component has re-rendered with busy=true.
  const confirmedRef = useRef(false);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) confirmedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus Cancel by default so an accidental Enter/Space after the
    // dialog opens never triggers a destructive action.
    cancelBtnRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (busy || confirmedRef.current) return;
    confirmedRef.current = true;
    onConfirm?.();
  };

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !busy) {
      onCancel?.();
    }
  };

  return (
    <div className="cd-backdrop" role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div
        className="cd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-dialog-title"
        aria-describedby={message ? 'cd-dialog-message' : undefined}
      >
        <h3 id="cd-dialog-title" className="cd-dialog__title">
          {title}
        </h3>
        {message && (
          <p id="cd-dialog-message" className="cd-dialog__message">
            {message}
          </p>
        )}
        <div className="cd-dialog__actions">
          {/* Cancel is focused via ref (see effect above) so an accidental
              Enter/Space after the dialog opens never confirms a destructive action. */}
          <button
            ref={cancelBtnRef}
            type="button"
            className="cd-btn cd-btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cd-btn ${tone === 'danger' ? 'cd-btn--danger' : 'cd-btn--primary'}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
