/**
 * Role-based access control middleware
 * - authorizeRoles(...roles): allow access if req.user.role is in allowed roles
 * - authorizePermissions(requiredPerms, { any }): allow if user's effective permissions (from DB Role + inheritance) satisfy required
 * - requireSameBranchAsTargetUser({ paramKey }): for Branch Admins; Super Admin bypasses
 * - utilities to compute effective permissions with DB fallback to a default in-memory map
 */

/**
 * @deprecated This file is deprecated and will be removed.
 * Please import from middleware/rbac.js instead.
 *
 * This file only exists for backward compatibility during migration.
 * All RBAC functions are now defined in middleware/rbac.js.
 */

export {
  ROLES,
  authorizeRoles,
  authorizePermissions,
  requireSameBranchAsTargetUser,
  requireSelfOrRoles,
} from "../middleware/rbac.js";
