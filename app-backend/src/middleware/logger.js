import AuditLog from '../models/AuditLogs.js';  // your separate model

const AUDIT_LOG_ENABLED = process.env.AUDIT_LOG_ENABLED === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

// Define all action constants
export const ACTIONS = {
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  SHIFT_APPLIED: 'SHIFT_APPLIED',
  VIEW_USERS: 'VIEW_USERS',
  VIEW_SHIFTS: 'VIEW_SHIFTS',
  SHIFT_COMPLETED: 'SHIFT_COMPLETED',
  MESSAGE_SENT: 'MESSAGE_SENT',
};

// Middleware to attach audit logging function to req
export const auditMiddleware = (req, res, next) => {
  req.audit = {
    log: async (user, action, details = {}) => {
      if (IS_DEV) {
        console.log(`[DEV] Audit log: ${action} by user ${user?._id || user}`, details);
      }
      if (!AUDIT_LOG_ENABLED) return;
      try {
        const logEntry = new AuditLog({ user, action, details });
        await logEntry.save();
      } catch (err) {
        console.error('Failed to save audit log:', err.message);
      }
    },
  };
  next();
};
