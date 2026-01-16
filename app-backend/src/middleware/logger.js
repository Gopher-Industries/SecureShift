import AuditLog from '../models/AuditLogs.js';  // your separate model

const AUDIT_LOG_ENABLED = process.env.AUDIT_LOG_ENABLED === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

// Define all action constants
export const ACTIONS = {
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',

  SHIFT_CREATED: 'SHIFT_CREATED',
  SHIFT_UPDATED: 'SHIFT_UPDATED',
  SHIFT_APPLIED: 'SHIFT_APPLIED',
  SHIFT_APPROVED: 'SHIFT_APPROVED',
  SHIFT_COMPLETED: 'SHIFT_COMPLETED',

  VIEW_USERS: 'VIEW_USERS',
  VIEW_SHIFTS: 'VIEW_SHIFTS',

  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_READ: 'MESSAGE_READ', 
  MESSAGE_SOFT_DELETED: 'MESSAGE_SOFT_DELETED',

  USER_SOFT_DELETED: 'USER_SOFT_DELETED',
  AVAILABILITY_UPDATED: 'AVAILABILITY_UPDATED',
  RATINGS_SUBMITTED: 'RATINGS_SUBMITTED',

  SITE_CREATED: 'SITE_CREATED',
  SITE_UPDATED: 'SITE_UPDATED',
  SITE_DELETED: 'SITE_DELETED',
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
        const logEntry = new AuditLog({ user, action, metadata: details });
        await logEntry.save();
      } catch (err) {
        console.error('Failed to save audit log:', err.message);
      }
    },
  };
  next();
};
