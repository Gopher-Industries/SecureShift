/**
 * Role-based access control middleware
 * - authorizeRoles(...roles): allow access if req.user.role is in allowed roles
 * - authorizePermissions(requiredPerms, { any }): allow if user's effective permissions (from DB Role + inheritance) satisfy required
 * - requireSameBranchAsTargetUser({ paramKey }): for Branch Admins; Super Admin bypasses
 * - utilities to compute effective permissions with DB fallback to a default in-memory map
 */
import Role from '../models/Role.js';
import User from '../models/User.js';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  BRANCH_ADMIN: 'branch_admin',
  EMPLOYER: 'employer',
  GUARD: 'guard',
  CLIENT: 'client',
};

// Default fallback permissions (if Role docs are missing)
// You can adjust this map as needed; DB values override these.
const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.ADMIN]: [
    'user:read', 'user:write', 'user:delete',
    'shift:read', 'shift:write', 'shift:assign',
    'payment:read', 'payment:write', 'payment:refund',
    'branch:read', 'branch:write',
    'rbac:read', 'rbac:write',
  ],
  [ROLES.BRANCH_ADMIN]: [
    'user:read', 'user:write',
    'shift:read', 'shift:write', 'shift:assign',
    'payment:read',
    'branch:read',
  ],
  [ROLES.EMPLOYER]: [
    'shift:read', 'shift:write',
    'payment:read', 'payment:write',
  ],
  [ROLES.GUARD]: [
    'shift:read', 'shift:accept', 'shift:checkin', 'shift:apply',
  ],
  [ROLES.CLIENT]: [
    'shift:read',
    'payment:write',
  ],
};

async function loadRoleFromDB(roleName) {
  if (!roleName) return null;
  return Role.findOne({ name: roleName }).lean();
}

async function getEffectivePermissions(roleName, visited = new Set()) {
  // Super Admin shortcut
  if (roleName === ROLES.SUPER_ADMIN) {
    return new Set(['*']);
  }

  // Prevent cycles
  if (visited.has(roleName)) return new Set();
  visited.add(roleName);

  const roleDoc = await loadRoleFromDB(roleName);
  let perms = new Set(roleDoc?.permissions || DEFAULT_ROLE_PERMISSIONS[roleName] || []);

  if (roleDoc?.inheritsFrom) {
    const parentPerms = await getEffectivePermissions(roleDoc.inheritsFrom, visited);
    for (const p of parentPerms) perms.add(p);
  }

  return perms;
}

function hasWildcard(perms) {
  return perms.has('*');
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Insufficient role' });
    }
    next();
  };
}

export function authorizePermissions(requiredPerms, options = { any: false }) {
  const permsArray = Array.isArray(requiredPerms) ? requiredPerms : [requiredPerms];
  const requireAny = !!options.any;

  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) return res.status(401).json({ message: 'Not authenticated' });

      const effectivePerms = await getEffectivePermissions(role);
      if (hasWildcard(effectivePerms)) return next();

      const hasAll = permsArray.every((p) => effectivePerms.has(p));
      const hasAny = permsArray.some((p) => effectivePerms.has(p));

      if ((requireAny && hasAny) || (!requireAny && hasAll)) {
        return next();
      }
      return res.status(403).json({ message: 'Insufficient permissions' });
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Require same branch as target user for Branch Admin.
 * Super Admin bypasses; Admin bypasses (treat admin as system-level).
 * paramKey: name of req.params key containing userId to compare
 */
export function requireSameBranchAsTargetUser({ paramKey = 'userId' } = {}) {
  return async (req, res, next) => {
    try {
      const requesterRole = req.user?.role;
      if (!requesterRole) return res.status(401).json({ message: 'Not authenticated' });

      if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(requesterRole)) {
        return next(); // system-wide access
      }

      if (requesterRole !== ROLES.BRANCH_ADMIN) {
        return res.status(403).json({ message: 'Only Branch Admins can use this scoped route' });
      }

      const targetUserId = req.params[paramKey];
      const [requester, target] = await Promise.all([
        User.findById(req.user.id).select('branch').lean(),
        User.findById(targetUserId).select('branch').lean(),
      ]);

      if (!requester?.branch) {
        return res.status(403).json({ message: 'Requester is not assigned to any branch' });
      }
      if (!target) {
        return res.status(404).json({ message: 'Target user not found' });
      }

      const same = String(requester.branch) === String(target.branch);
      if (!same) {
        return res.status(403).json({ message: 'Cross-branch action is not allowed' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Allow if acting on self or has certain roles (e.g., admins)
 * paramKey: param name for target user id
 */
export function requireSelfOrRoles({ paramKey = 'userId', roles = [] } = {}) {
  return (req, res, next) => {
    const requesterId = req.user?.id || req.user?._id;
    const targetId = req.params[paramKey];
    const role = req.user?.role;

    if (!requesterId) return res.status(401).json({ message: 'Not authenticated' });
    if (String(requesterId) === String(targetId)) return next();
    if (roles.includes(role)) return next();

    return res.status(403).json({ message: 'Insufficient privileges' });
  };
}