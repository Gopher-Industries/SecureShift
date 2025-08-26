import AuditLog from '../models/AuditLogs.js';  // your separate model

// Define all your action constants
export const ACTIONS = {
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
    log: async (userId, action, details = {}) => {
      try {
        const logEntry = new AuditLog({ userId, action, details });
        await logEntry.save();
        console.log(`Audit log: ${action} by user ${userId}`, details);
      } catch (err) {
        console.error('Failed to save audit log:', err.message);
      }
    },
  };
  next();
};
