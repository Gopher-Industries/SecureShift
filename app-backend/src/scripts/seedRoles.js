/**
 * Seed default roles and permissions for SecureShift
 * Usage:
 *  node -r dotenv/config ./src/scripts/seedRoles.js
 */
import mongoose from 'mongoose';
import Role from '../models/Role.js';

const MONGO_URI = process.env.MONGO_URI;

const DEFAULTS = [
  {
    name: 'super_admin',
    description: 'System-wide super administrator',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'admin',
    description: 'System admin with broad permissions',
    permissions: [
      'user:read', 'user:write', 'user:delete',
      'shift:read', 'shift:write', 'shift:assign',
      'payment:read', 'payment:write', 'payment:refund',
      'branch:read', 'branch:write',
      'rbac:read', 'rbac:write',
    ],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'branch_admin',
    description: 'Branch-level admin for a specific branch',
    permissions: [
      'user:read', 'user:write',
      'shift:read', 'shift:write', 'shift:assign',
      'payment:read',
      'branch:read',
    ],
    inheritsFrom: null,
    isSystem: true,
  },
  {
    name: 'employer',
    description: 'Employer role',
    permissions: [
      'shift:read', 'shift:write',
      'payment:read', 'payment:write',
    ],
    isSystem: true,
  },
  {
    name: 'guard',
    description: 'Guard role',
    permissions: [
      'shift:read', 'shift:accept', 'shift:checkin',
    ],
    isSystem: true,
  },
  {
    name: 'client',
    description: 'Client role',
    permissions: [
      'shift:read',
      'payment:write',
    ],
    isSystem: true,
  },
];

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

  for (const r of DEFAULTS) {
    await Role.findOneAndUpdate(
      { name: r.name },
      { $set: r },
      { upsert: true, new: true }
    );
    console.log(`Seeded role: ${r.name}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});