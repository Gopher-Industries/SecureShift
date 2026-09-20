// Roles & Permissions service (AP-034)
//
// There is no live roles/permissions API yet (BE-05). This module provides an
// in-memory mock that mirrors the backend Role model
// (app-backend/src/models/Role.js) and the seeded defaults
// (app-backend/src/scripts/seedRoles.js), so the UI can be built and
// demoed now and swapped onto the real endpoints later with no page changes.
//
// To go live once BE-05 lands, replace the two functions at the bottom with:
//   export const getRoles = () => http.get('/admin/roles').then((r) => r.data);
//   export const updateRolePermissions = (name, permissions) =>
//     http.put(`/admin/roles/${name}`, { permissions }).then((r) => r.data);

// Full permission catalogue, grouped by resource. These are the exact
// identifiers used across the backend RBAC (e.g. 'user:read', 'shift:assign',
// 'payment:refund', 'rbac:write').
export const PERMISSION_GROUPS = [
  {
    resource: 'User',
    permissions: ['user:read', 'user:write', 'user:delete'],
  },
  {
    resource: 'Shift',
    permissions: ['shift:read', 'shift:write', 'shift:assign', 'shift:accept', 'shift:checkin'],
  },
  {
    resource: 'Payment',
    permissions: ['payment:read', 'payment:write', 'payment:refund'],
  },
  {
    resource: 'Branch',
    permissions: ['branch:read', 'branch:write'],
  },
  {
    resource: 'RBAC',
    permissions: ['rbac:read', 'rbac:write'],
  },
];

// Human-readable label for each permission identifier, shown in the UI.
export const PERMISSION_LABELS = {
  'user:read': 'View users',
  'user:write': 'Create & edit users',
  'user:delete': 'Delete users',
  'shift:read': 'View shifts',
  'shift:write': 'Create & edit shifts',
  'shift:assign': 'Assign shifts to guards',
  'shift:accept': 'Accept shifts',
  'shift:checkin': 'Check in / out of shifts',
  'payment:read': 'View payments',
  'payment:write': 'Process payments',
  'payment:refund': 'Refund payments',
  'branch:read': 'View branches',
  'branch:write': 'Manage branches',
  'rbac:read': 'View roles & permissions',
  'rbac:write': 'Manage roles & permissions',
};

// Friendly label for a permission id, falling back to the raw id if unmapped.
export const labelFor = (permission) => PERMISSION_LABELS[permission] || permission;

// Flat list of every concrete permission (excludes the '*' wildcard).
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions);

// The wildcard super_admin holds — grants everything.
export const WILDCARD = '*';

// Seed data mirrors app-backend/src/scripts/seedRoles.js exactly.
const SEED_ROLES = [
  {
    name: 'super_admin',
    description: 'System-wide super administrator',
    permissions: [WILDCARD],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'admin',
    description: 'System admin with broad permissions',
    permissions: [
      'user:read',
      'user:write',
      'user:delete',
      'shift:read',
      'shift:write',
      'shift:assign',
      'payment:read',
      'payment:write',
      'payment:refund',
      'branch:read',
      'branch:write',
      'rbac:read',
      'rbac:write',
    ],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'branch_admin',
    description: 'Branch-level admin for a specific branch',
    permissions: [
      'user:read',
      'user:write',
      'shift:read',
      'shift:write',
      'shift:assign',
      'payment:read',
      'branch:read',
    ],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'employer',
    description: 'Employer role',
    permissions: ['user:read', 'shift:read', 'shift:write', 'payment:read', 'payment:write'],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'guard',
    description: 'Guard role',
    permissions: ['shift:read', 'shift:accept', 'shift:checkin'],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'client',
    description: 'Client role',
    permissions: ['shift:read', 'payment:write'],
    inheritsFrom: null,
    isSystem: true,
  },
];

// Simulate network latency so loading states are exercised in the demo.
const LATENCY_MS = 300;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Deep-ish clone so callers can't mutate the store by reference.
const cloneRole = (role) => ({ ...role, permissions: [...role.permissions] });

// Module-level store persists for the life of the session (like a tiny DB).
let store = SEED_ROLES.map(cloneRole);

// GET /admin/roles
export const getRoles = async () => {
  await delay(LATENCY_MS);
  return store.map(cloneRole);
};

// PUT /admin/roles/:name  { permissions }
// Rejects unknown roles and edits to system wildcard roles, mirroring how the
// real endpoint would guard super_admin's '*'.
export const updateRolePermissions = async (name, permissions) => {
  await delay(LATENCY_MS);

  const index = store.findIndex((role) => role.name === name);
  if (index === -1) {
    const error = new Error('Role not found');
    error.response = { data: { message: 'Role not found' } };
    throw error;
  }

  if (store[index].permissions.includes(WILDCARD)) {
    const error = new Error('Super admin permissions cannot be edited');
    error.response = { data: { message: 'Super admin permissions cannot be edited' } };
    throw error;
  }

  // Keep only recognised permissions, de-duplicated and in catalogue order.
  const allowed = new Set(ALL_PERMISSIONS);
  const nextPermissions = ALL_PERMISSIONS.filter(
    (perm) => allowed.has(perm) && permissions.includes(perm)
  );

  store[index] = { ...store[index], permissions: nextPermissions };
  return cloneRole(store[index]);
};

// Test helper: restore the seed so specs don't leak state between cases.
export const __resetRolesStore = () => {
  store = SEED_ROLES.map(cloneRole);
};
