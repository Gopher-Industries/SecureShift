# RBAC in SecureShift

This project uses fine-grained Role-Based Access Control.

Core roles:
- super_admin: system-wide access
- admin: system-level admin (broad access)
- branch_admin: branch-scoped administrator
- employer: employer panel access
- guard: guard app access
- client: limited customer access

Permissions are strings like:
- user:read, user:write, user:delete
- shift:read, shift:write, shift:assign
- payment:read, payment:write, payment:refund
- branch:read, branch:write
- rbac:read, rbac:write

Super Admin has "*".
Admin has broad set.
Branch Admin is scoped to their branch (enforced in middleware/controllers).

Applying middleware:
- authorizeRoles(...roles): check a user's role
- authorizePermissions(perms, { any }): check DB-backed permissions (with fallback defaults)
- requireSameBranchAsTargetUser({ paramKey }): branch scope validation

Admin Panel API (requires Admin/Super Admin):
- GET /api/v1/rbac/roles
- POST /api/v1/rbac/roles
- PATCH /api/v1/rbac/roles/{name}/permissions
- DELETE /api/v1/rbac/roles/{name}
- PATCH /api/v1/rbac/users/{userId}/role

Seeding:
- node -r dotenv/config ./src/scripts/seedRoles.js