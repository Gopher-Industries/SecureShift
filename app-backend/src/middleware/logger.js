import AuditLog from "../models/AuditLogs.js"; // your separate model
import AUDIT_LOG_ENABLED from "../config/audit.js";

const IS_DEV = process.env.NODE_ENV === "development";

// Define all action constants
export const ACTIONS = {
  PROFILE_CREATED: "PROFILE_CREATED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  ADMIN_ACTION: "ADMIN_ACTION",
  OTP_SENT: "OTP_SENT",
  OTP_DELIVERY_FAILED: "OTP_DELIVERY_FAILED",

  SHIFT_CREATED: "SHIFT_CREATED",
  SHIFT_UPDATED: "SHIFT_UPDATED",
  SHIFT_APPLIED: "SHIFT_APPLIED",
  SHIFT_APPROVED: "SHIFT_APPROVED",
  SHIFT_COMPLETED: "SHIFT_COMPLETED",
  SHIFT_FATIGUE_BLOCKED: "SHIFT_FATIGUE_BLOCKED",

  VIEW_USERS: "VIEW_USERS",
  VIEW_SHIFTS: "VIEW_SHIFTS",

  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_READ: "MESSAGE_READ",
  MESSAGE_SOFT_DELETED: "MESSAGE_SOFT_DELETED",

  USER_SOFT_DELETED: "USER_SOFT_DELETED",
  AVAILABILITY_UPDATED: "AVAILABILITY_UPDATED",
  RATINGS_SUBMITTED: "RATINGS_SUBMITTED",

  SITE_CREATED: "SITE_CREATED",
  SITE_UPDATED: "SITE_UPDATED",
  SITE_DELETED: "SITE_DELETED",

  INCIDENT_CREATED: "INCIDENT_CREATED",
  INCIDENT_UPDATED: "INCIDENT_UPDATED",
  INCIDENT_DELETED: "INCIDENT_DELETED",
  PAYROLL_APPROVED: "PAYROLL_APPROVED",
  PAYROLL_PROCESSED: "PAYROLL_PROCESSED",

  EQUIPMENT_CREATED: "EQUIPMENT_CREATED",
  EQUIPMENT_ASSIGNED: "EQUIPMENT_ASSIGNED",
  EQUIPMENT_REPORTED: "EQUIPMENT_REPORTED",
};

// Middleware to attach audit logging function to req
export const auditMiddleware = (req, res, next) => {
  req.audit = {
    log: async (user, action, details = {}) => {
      if (IS_DEV) {
        console.log(
          `[DEV] Audit log: ${action} by user ${user?._id || user}`,
          details,
        );
      }
      if (!AUDIT_LOG_ENABLED) return;
      try {
        const logEntry = new AuditLog({ user, action, metadata: details });
        await logEntry.save();
      } catch (err) {
        console.error("Failed to save audit log:", err.message);
      }
    },
  };
  next();
};
