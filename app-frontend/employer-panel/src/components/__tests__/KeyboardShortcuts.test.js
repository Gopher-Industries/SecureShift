import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useKeyboardShortcuts, { isEditableElement } from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutModal from '../KeyboardShortcutModal';

// Test wrapper component to test hook integration with modal & navigation
function TestShortcutWrapper({ navigateMock }) {
  const { isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts(navigateMock);

  return (
    <div>
      <input data-testid="test-input" placeholder="Type here" />
      <textarea data-testid="test-textarea" defaultValue="Text area content" />
      <select data-testid="test-select">
        <option value="1">Option 1</option>
      </select>
      <div
        data-testid="test-contenteditable"
        contentEditable="true"
        suppressContentEditableWarning={true}
      >
        Editable div
      </div>
      <div data-testid="test-textbox-role" role="textbox" tabIndex="0">
        Role textbox
      </div>

      <KeyboardShortcutModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
    </div>
  );
}

describe('FE 029 - Keyboard Shortcuts', () => {
  let navigateMock;
  let originalReload;

  beforeEach(() => {
    navigateMock = jest.fn();
    originalReload = window.location.reload;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: jest.fn() },
    });
  });

  afterEach(() => {
    window.location.reload = originalReload;
    jest.restoreAllMocks();
  });

  describe('isEditableElement helper', () => {
    test('identifies input, textarea, select, contenteditable, and role=textbox', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      expect(isEditableElement(screen.getByTestId('test-input'))).toBe(true);
      expect(isEditableElement(screen.getByTestId('test-textarea'))).toBe(true);
      expect(isEditableElement(screen.getByTestId('test-select'))).toBe(true);
      expect(isEditableElement(screen.getByTestId('test-contenteditable'))).toBe(true);
      expect(isEditableElement(screen.getByTestId('test-textbox-role'))).toBe(true);

      // Non-editable element
      const div = document.createElement('div');
      expect(isEditableElement(div)).toBe(false);
      expect(isEditableElement(null)).toBe(false);
    });
  });

  describe('Navigation shortcuts (Ctrl / Cmd + Shift + S/G/P, N)', () => {
    test('Ctrl + Shift + S navigates to /manage-shift', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 's', ctrlKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/manage-shift');
    });

    test('Cmd + Shift + S (macOS) navigates to /manage-shift', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'S', metaKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/manage-shift');
    });

    test('Ctrl + Shift + G navigates to /guard-profiles', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'g', ctrlKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/guard-profiles');
    });

    test('Cmd + Shift + G (macOS) navigates to /guard-profiles', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'G', metaKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/guard-profiles');
    });

    test('Ctrl + Shift + P navigates to /payroll', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/payroll');
    });

    test('Cmd + Shift + P (macOS) navigates to /payroll', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'P', metaKey: true, shiftKey: true });
      expect(navigateMock).toHaveBeenCalledWith('/payroll');
    });

    test('N key navigates to /create-shift when no modifiers are active', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'n' });
      expect(navigateMock).toHaveBeenCalledWith('/create-shift');
    });
  });

  describe('Refresh shortcut (R)', () => {
    test('R key triggers window.location.reload() when no modifiers are active', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'r' });
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Shortcut Help Modal toggle (?, Esc, click)', () => {
    test('? key opens shortcut help modal', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      expect(screen.queryByTestId('ks-modal-overlay')).not.toBeInTheDocument();

      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('ks-modal-overlay')).toBeInTheDocument();
      expect(screen.getByText('Shifts')).toBeInTheDocument();
      expect(screen.getByText('Guards')).toBeInTheDocument();
      expect(screen.getByText('Payroll')).toBeInTheDocument();
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });

    test('Esc key closes the shortcut help modal', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('ks-modal-overlay')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('ks-modal-overlay')).not.toBeInTheDocument();
    });

    test('Close button closes the shortcut help modal', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('ks-modal-overlay')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('ks-modal-close-btn'));
      expect(screen.queryByTestId('ks-modal-overlay')).not.toBeInTheDocument();
    });

    test('Backdrop click closes the shortcut help modal', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: '?' });
      const overlay = screen.getByTestId('ks-modal-overlay');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay);
      expect(screen.queryByTestId('ks-modal-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Bypassing editable elements', () => {
    test('shortcuts are ignored when focused inside <input>', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);
      const input = screen.getByTestId('test-input');

      fireEvent.keyDown(input, { key: 'n' });
      expect(navigateMock).not.toHaveBeenCalled();

      fireEvent.keyDown(input, { key: 'r' });
      expect(window.location.reload).not.toHaveBeenCalled();

      fireEvent.keyDown(input, { key: '?' });
      expect(screen.queryByTestId('ks-modal-overlay')).not.toBeInTheDocument();

      fireEvent.keyDown(input, { key: 's', ctrlKey: true, shiftKey: true });
      expect(navigateMock).not.toHaveBeenCalled();
    });

    test('shortcuts are ignored when focused inside <textarea>', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);
      const textarea = screen.getByTestId('test-textarea');

      fireEvent.keyDown(textarea, { key: 'n' });
      expect(navigateMock).not.toHaveBeenCalled();
    });

    test('shortcuts are ignored when focused inside <select>', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);
      const select = screen.getByTestId('test-select');

      fireEvent.keyDown(select, { key: 'n' });
      expect(navigateMock).not.toHaveBeenCalled();
    });

    test('shortcuts are ignored when focused inside contenteditable element', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);
      const editable = screen.getByTestId('test-contenteditable');

      fireEvent.keyDown(editable, { key: 'n' });
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  describe('Modifier key isolation for N and R', () => {
    test('N does not trigger if Ctrl/Cmd/Alt/Shift is pressed', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'n', metaKey: true });
      fireEvent.keyDown(window, { key: 'n', altKey: true });
      fireEvent.keyDown(window, { key: 'N', shiftKey: true });

      expect(navigateMock).not.toHaveBeenCalled();
    });

    test('R does not trigger if Ctrl/Cmd/Alt/Shift is pressed', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      fireEvent.keyDown(window, { key: 'r', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'r', metaKey: true });
      fireEvent.keyDown(window, { key: 'r', altKey: true });
      fireEvent.keyDown(window, { key: 'R', shiftKey: true });

      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });

  describe('Browser shortcuts non-interference & listener cleanup', () => {
    test('normal browser shortcuts (Ctrl+C, Ctrl+V, Ctrl+R) do not call preventDefault', () => {
      render(<TestShortcutWrapper navigateMock={navigateMock} />);

      const eventCopy = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true });
      const preventDefaultSpy = jest.spyOn(eventCopy, 'preventDefault');
      window.dispatchEvent(eventCopy);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    test('cleans up keyboard event listener on unmount', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<TestShortcutWrapper navigateMock={navigateMock} />);

      unmount();
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
