/**
 * @file middleware/role.js
 * @description Role-based access control middleware for SecureShift.
 * Allows routes to be protected by specific user roles (admin, employer, guard).
 *
 * @usage
 * app.use(auth, allowRoles('admin'))
 */

/**
 * Middleware to allow access based on roles
 * @param  {...string} allowedRoles - Roles allowed for the route
 * @returns middleware function
 */

/**
 * @deprecated This file is deprecated and will be removed in a future PR.
 * Please import from middleware/rbac.js instead.
 *
 * @usage
 * // Instead of:
 * import { allowRoles, adminOnly, employerOnly, guardOnly } from "../middleware/role.js";
 *
 * // Use:
 * import { allowRoles, adminOnly, employerOnly, guardOnly } from "../middleware/rbac.js";
 *
 * All functions are now exported from middleware/rbac.js.
 */

/**
 * Re-export from rbac.js for backward compatibility during migration.
 * These will be removed once all route files are migrated.
 */
export { allowRoles, adminOnly, employerOnly, guardOnly } from "./rbac.js";
