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
export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied for your role.' });
    }
    next();
  };
};

// Shorthand exports for common roles
export const guardOnly = allowRoles('guard');
export const employerOnly = allowRoles('employer');
export const adminOnly = allowRoles('admin');
