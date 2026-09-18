
# RBAC (Role-Based Access Control) System

## Overview

SecureShift uses a unified RBAC middleware system to protect API endpoints. All authorization logic is centralized in `src/middleware/rbac.js` and exposed through a single entry point.

## Roles

The system defines the following roles:

| Role             | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `admin`        | System administrator with full access                  |
| `employer`     | Employer managing shifts and guards                    |
| `guard`        | Guard applying for and working shifts                  |
| `super_admin`  | System-wide super administrator (wildcard permissions) |
| `branch_admin` | Branch-level administrator                             |
| `client`       | Client role with limited access                        |

> **Note:** `super_admin`, `branch_admin`, and `client` are defined in the `ROLES` constant but are not currently assignable via the `User.role` enum.

## Middleware Functions

### `authorizeRoles(...roles)`

Checks if the authenticated user's role is in the allowed roles list.

```javascript
import { authorizeRoles } from "../middleware/rbac.js";

router.get("/admin", auth, authorizeRoles("admin"), adminHandler);
router.post("/shifts", auth, authorizeRoles("employer"), createShift);
router.get("/shifts", auth, authorizeRoles("guard", "employer", "admin"), listShifts);
```

### `authorizePermissions(requiredPerms, options)`

Checks if the user has the required permissions.

```javascript
import { authorizePermissions } from "../middleware/rbac.js";

// Requires ALL permissions
router.post("/incidents", authorizePermissions(["incident:create"]), createIncident);

// Requires ANY permission (OR)
router.get("/data", authorizePermissions(["user:read", "shift:read"], { any: true }), getData);
```

### `allowRoles(...roles)`

**Deprecated** — alias for `authorizeRoles`. Use `authorizeRoles` instead.

### `adminOnly`, `employerOnly`, `guardOnly`

**Deprecated** — shorthand for `authorizeRoles("admin")`, etc. Use `authorizeRoles` directly.

### `requireSelfOrRoles({ paramKey, roles })`

Allows access if the request targets the user themselves or if the user has one of the allowed roles.

```javascript
import { requireSelfOrRoles } from "../middleware/rbac.js";

// Allows access to /users/:userId only if the user is viewing themselves or is an admin
router.get(
  "/users/:userId",
  auth,
  requireSelfOrRoles({ roles: ["admin"] }),
  getUserProfile
);
```

### `requireSameBranchAsTargetUser({ paramKey })`

Restricts access to users in the same branch (Branch Admin only).

## Permission System

Permissions are stored in the `Role` model and can be inherited via `inheritsFrom`. Default permissions are defined in `DEFAULT_ROLE_PERMISSIONS` and serve as fallback when no Role document exists.

### Permission Format

Permissions follow the pattern `resource:action`:

- `user:read`, `user:write`, `user:delete`
- `shift:read`, `shift:write`, `shift:assign`
- `payment:read`, `payment:write`, `payment:refund`
- `branch:read`, `branch:write`
- `incident:create`, `incident:view`, `incident:update`, `incident:delete`
- `rbac:read`, `rbac:write`

The wildcard `*` grants all permissions.

### Default Role Permissions

| Role             | Permissions                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `super_admin`  | `*`                                                                                                                             |
| `admin`        | `user:*`, `shift:*`, `payment:*`, `branch:*`, `rbac:*`, `incident:*`                                                  |
| `branch_admin` | `user:read`, `user:write`, `shift:*`, `payment:read`, `branch:read`                                                     |
| `employer`     | `shift:read`, `shift:write`, `payment:read`, `payment:write`, `incident:view`, `incident:update`                      |
| `guard`        | `shift:read`, `shift:accept`, `shift:checkin`, `shift:apply`, `incident:create`, `incident:view`, `incident:update` |
| `client`       | `shift:read`, `payment:write`                                                                                                 |

### Inheritance

Roles can inherit from a parent role via `inheritsFrom`. The child role's permissions are merged with the parent's permissions. Cycles are prevented automatically.

```javascript
// Role document in database
{
  name: "shift_supervisor",
  permissions: ["shift:approve"],
  inheritsFrom: "guard"
}
// Effective permissions: shift:approve + all guard permissions
```

## Usage in Route Files

All route files should import RBAC middleware from `src/middleware/rbac.js`:

```javascript
import {
  authorizeRoles,
  authorizePermissions,
  requireSelfOrRoles,
  requireSameBranchAsTargetUser,
  ROLES,
} from "../middleware/rbac.js";
```

Do not import from:

- `src/middleware/role.js` — deprecated
- `src/controllers/rbac.controller.js` — deprecated

## Testing

RBAC middleware is covered by:

| Test File                                      | Purpose                           |
| ---------------------------------------------- | --------------------------------- |
| `tests/rbac.consolidation.test.js`           | Consolidation verification        |
| `tests/rbac.entrypoint.test.js`              | Entry point unification           |
| `tests/rbac.route.migration.test.js`         | Route layer migration             |
| `tests/rbac.requireSelfOrRoles.test.js`      | `requireSelfOrRoles` middleware |
| `tests/rbac.permissions.inheritance.test.js` | Permission inheritance            |
| `tests/rbac.equipment.routes.test.js`        | Equipment module integration      |
| `tests/rbac.middleware.test.js`              | General RBAC middleware tests     |

## Migration from Old Implementation

| Old Import                                   | New Import                       |
| -------------------------------------------- | -------------------------------- |
| `from "../middleware/role.js"`             | `from "../middleware/rbac.js"` |
| `from "../controllers/rbac.controller.js"` | `from "../middleware/rbac.js"` |
| `allowRoles(...)`                          | `authorizeRoles(...)`          |
| `adminOnly`                                | `authorizeRoles("admin")`      |
| `employerOnly`                             | `authorizeRoles("employer")`   |
| `guardOnly`                                | `authorizeRoles("guard")`      |

## API Response Reference

### Success

No response is generated on success; the middleware calls `next()` and lets the route handler produce the response.

### Failure

| Status | Message                                          | Condition                                                    |
| ------ | ------------------------------------------------ | ------------------------------------------------------------ |
| 401    | `Not authenticated`                            | `req.user` is missing                                      |
| 403    | `Insufficient role`                            | User's role not in allowed list                              |
| 403    | `Insufficient permissions`                     | User lacks required permission(s)                            |
| 403    | `Insufficient privileges`                      | `requireSelfOrRoles` fails                                 |
| 403    | `Only Branch Admins can use this scoped route` | `requireSameBranchAsTargetUser` called by non-Branch-Admin |
| 403    | `Cross-branch action is not allowed`           | Branch mismatch                                              |
| 404    | `Target user not found`                        | Target user does not exist                                   |

## Architecture Notes

- **Single source of truth**: `src/middleware/rbac.js` is the only file that defines RBAC logic.
- **Backward compatibility**: `role.js` and `controllers/rbac.controller.js` re-export from `rbac.js` for compatibility, but should not be used in new code.
- **Database-backed permissions**: Permission checks query the `Role` model at runtime. Fallback defaults are used when no `Role` document is found.
- **Cycle-safe inheritance**: The `getEffectivePermissions` function uses a `visited` set to prevent infinite loops from circular `inheritsFrom` references.
