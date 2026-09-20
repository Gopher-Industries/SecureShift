import { useState, useEffect, useCallback } from 'react';

/**
 * Helper to check if an event target is an editable form element
 * or an element with editable ARIA roles/attributes.
 */
export const isEditableElement = (target) => {
  if (!target) return false;

  const tagName = target.tagName ? target.tagName.toUpperCase() : '';
  const isFormInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
  const isContentEditable =
    target.isContentEditable || target.getAttribute?.('contenteditable') === 'true';

  const role = target.getAttribute?.('role');
  const isEditableRole = ['textbox', 'searchbox', 'combobox'].includes(role);

  return isFormInput || isContentEditable || isEditableRole;
};

/**
 * Custom hook to manage global keyboard shortcuts for the Employer Panel.
 *
 * @param {Function} navigate - React Router navigate function
 * @returns {Object} { isHelpModalOpen, closeHelpModal, toggleHelpModal, setIsHelpModalOpen }
 */
export function useKeyboardShortcuts(navigate) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
  }, []);

  const toggleHelpModal = useCallback(() => {
    setIsHelpModalOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Esc key handling for closing the help modal
      if (event.key === 'Escape' || event.key === 'Esc') {
        setIsHelpModalOpen((prevOpen) => {
          if (prevOpen) {
            event.preventDefault();
            return false;
          }
          return false;
        });
        return;
      }

      // 2. Ignore all shortcuts if user is typing in an editable field
      if (isEditableElement(event.target)) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;
      const keyUpper = event.key ? event.key.toUpperCase() : '';

      // 3. Multi-key combination shortcuts: Ctrl/Cmd + Shift + S/G/P
      if (isCtrlOrCmd && isShift && !isAlt) {
        if (keyUpper === 'S') {
          event.preventDefault();
          if (typeof navigate === 'function') {
            navigate('/manage-shift');
          }
          return;
        }
        if (keyUpper === 'G') {
          event.preventDefault();
          if (typeof navigate === 'function') {
            navigate('/guard-profiles');
          }
          return;
        }
        if (keyUpper === 'P') {
          event.preventDefault();
          if (typeof navigate === 'function') {
            navigate('/payroll');
          }
          return;
        }
      }

      // 4. Single-key shortcuts: N, R, ?
      // Must not trigger when Ctrl, Cmd, or Alt modifiers are active
      if (!isCtrlOrCmd && !isAlt) {
        // '?' key trigger (Shift+/ or '?')
        if (event.key === '?' || (isShift && (event.key === '?' || event.code === 'Slash'))) {
          event.preventDefault();
          setIsHelpModalOpen((prev) => !prev);
          return;
        }

        // N key (Create New) - no Shift modifier allowed
        if (!isShift && (event.key === 'n' || event.key === 'N')) {
          event.preventDefault();
          if (typeof navigate === 'function') {
            navigate('/create-shift');
          }
          return;
        }

        // R key (Refresh) - no Shift modifier allowed
        if (!isShift && (event.key === 'r' || event.key === 'R')) {
          event.preventDefault();
          if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return {
    isHelpModalOpen,
    closeHelpModal,
    toggleHelpModal,
    setIsHelpModalOpen,
  };
}

export default useKeyboardShortcuts;
