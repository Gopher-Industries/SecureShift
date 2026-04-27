import mongoose from 'mongoose';

/**
 * Role model for dynamic, DB-stored permissions and optional inheritance
 * name: unique role name, e.g., 'super_admin', 'branch_admin', 'admin', 'guard', 'client', 'employer'
 * permissions: string identifiers like 'user:read', 'shift:write', 'payment:refund'
 * inheritsFrom: optional parent role name (single inheritance for simplicity)
 */
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] },
    inheritsFrom: { type: String, default: null }, // name of parent role
    isSystem: { type: Boolean, default: false }, // prevent deletion of core roles
  },
  { timestamps: true }
);

roleSchema.index({ name: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;