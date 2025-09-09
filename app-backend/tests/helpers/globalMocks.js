/**
 * Centralized test mocks that should be applied before importing controllers.
 * Import this at the top of test files (before importing modules that rely on these mocks):
 *
 *   import './helpers/globalMocks.js';
 *
 * This file uses relative paths from the tests/ directory.
 */

import { createSendOTPMock } from './commonMocks.js';

// Common sendOTP mock used by auth tests
const sendOTP = createSendOTPMock();
jest.mock('../../src/utils/sendEmail.js', () => ({ sendOTP }));

// Global express-validator mock (tests may override or inspect validationResult)
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));
