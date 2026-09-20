import React from 'react';
import './KeyboardShortcutModal.css';

/**
 * Keyboard Shortcut Help Modal Component.
 * Displays all supported Employer Panel keyboard shortcuts.
 */
export default function KeyboardShortcutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shortcuts = [
    {
      keys: ['Ctrl / Cmd', 'Shift', 'S'],
      description: 'Shifts',
    },
    {
      keys: ['Ctrl / Cmd', 'Shift', 'G'],
      description: 'Guards',
    },
    {
      keys: ['Ctrl / Cmd', 'Shift', 'P'],
      description: 'Payroll',
    },
    {
      keys: ['N'],
      description: 'Create New',
    },
    {
      keys: ['R'],
      description: 'Refresh',
    },
    {
      keys: ['Esc'],
      description: 'Close',
    },
    {
      keys: ['?'],
      description: 'Show Keyboard Shortcuts',
    },
  ];

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div
      className="ks-modal-overlay"
      onClick={handleBackdropClick}
      data-testid="ks-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ks-modal-title"
    >
      <div className="ks-modal-container">
        <div className="ks-modal-header">
          <h2 id="ks-modal-title" className="ks-modal-title">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="ks-modal-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
            data-testid="ks-modal-close-btn"
          >
            &times;
          </button>
        </div>

        <div className="ks-modal-body">
          <div className="ks-shortcut-list">
            {shortcuts.map((item, index) => (
              <div key={index} className="ks-shortcut-item">
                <span className="ks-shortcut-label">{item.description}</span>
                <div className="ks-keys-container">
                  {item.keys.map((keyStr, kIdx) => (
                    <React.Fragment key={kIdx}>
                      <kbd className="ks-key-badge">{keyStr}</kbd>
                      {kIdx < item.keys.length - 1 && <span className="ks-key-plus">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="ks-modal-footer">
            Press <kbd className="ks-key-badge">Esc</kbd> anytime to close
          </div>
        </div>
      </div>
    </div>
  );
}
