# Ticket 5: Backend RBAC Route Matrix

This document records the current authentication and authorisation behaviour of the SecureShift backend (`app-backend`). It is based on a full mount-chain audit of the repository and a second-pass verification of route counts, matrix rows and defect findings.

**Scope:** repository behaviour only. No production database contents are assumed.  
**Mount chain:** `server.js` → `src/app.js` → `src/routes/index.js` → each mounted route module.  
**API base:** `/api/v1` (`src/app.js`).

---

## 1. Summary

| Item | Finding |
|------|---------|
| Assignable `User.role` values | `guard`, `employer`, `admin` only (`src/models/User.js`) |
| Role collection / `ROLES` constants | Also define `super_admin`, `branch_admin`, `client` |
| Unique mounted handlers | **108** |
| `/api/v1/rbac/*` duplicates | Removed in BE 006 (no longer mounted) |
| Unmounted route modules | `dashboard.routes.js`, `verification.routes.js` |

Highest-severity confirmed defects:

- `GET /api/v1/attendance/:userId` allows any authenticated caller to request any `userId`
- Equipment routes require authentication only (no role or ownership middleware)
- Employer document listing returns documents for all users (no employer tenant filter)
- Incident permission strings exist in fallback maps but not in seed scripts
- `ROLES.EMPLOYEE` is referenced but undefined on `GET /api/v1/users/guards`
- Branch scoping middleware reads `User.branch`, which is not defined on the User schema

---

## 2. Canonical roles and permissions

### 2.1 Persisted user roles

The `User` model discriminator key is:

```text
enum: ['guard', 'employer', 'admin']
```

Evidence: `src/models/User.js` (role field). Discriminators: `Guard`, `Employer`, `Admin`.

JWT authentication attaches `req.user.role` from the token payload (`src/middleware/auth.js`). Tokens are issued from the user’s stored `role`.

### 2.2 Role collection and constants

The `Role` model stores named roles with string permissions (`src/models/Role.js`). Constants in `src/middleware/rbac.js`:

| Constant | Value |
|----------|--------|
| `ROLES.SUPER_ADMIN` | `super_admin` |
| `ROLES.ADMIN` | `admin` |
| `ROLES.BRANCH_ADMIN` | `branch_admin` |
| `ROLES.EMPLOYER` | `employer` |
| `ROLES.GUARD` | `guard` |
| `ROLES.CLIENT` | `client` |

`super_admin`, `branch_admin` and `client` appear in Role seeds and middleware but are **not** in the `User.role` enum, so they cannot be assigned through normal User persistence.

### 2.3 Seeded permissions (`src/scripts/seedRoles.js`)

| Role | Permissions |
|------|-------------|
| `super_admin` | `*` |
| `admin` | `user:read`, `user:write`, `user:delete`, `shift:read`, `shift:write`, `shift:assign`, `payment:read`, `payment:write`, `payment:refund`, `branch:read`, `branch:write`, `rbac:read`, `rbac:write` |
| `branch_admin` | `user:read`, `user:write`, `shift:read`, `shift:write`, `shift:assign`, `payment:read`, `branch:read` |
| `employer` | `shift:read`, `shift:write`, `payment:read`, `payment:write` |
| `guard` | `shift:read`, `shift:accept`, `shift:checkin` |
| `client` | `shift:read`, `payment:write` |

Local seed data (`src/scripts/seed/data.js`) differs: `admin` and `branch_admin` have narrower permission sets (for example, no `payment:*` / `rbac:*` on admin in that seed).

### 2.4 Fallback permissions (`src/middleware/rbac.js`)

When a Role document is missing (or permissions are falsy), `getEffectivePermissions` uses `DEFAULT_ROLE_PERMISSIONS`. That map adds `incident:*` (and for guard also `shift:apply`) relative to `seedRoles.js`.

**Important:** if a Role document exists, its `permissions` array is used **without** merging the fallback map. Effective incident access therefore depends on how Role documents were seeded in the running environment (see Section 9).

### 2.5 Middleware layers (how to read the matrix)

| Layer | Meaning | Typical location |
|-------|---------|------------------|
| Auth MW | JWT required (`auth` / `protect`) | Route definition |
| Role/Perm MW | `allowRoles`, `adminOnly`, `employerOnly`, `authorizeRoles`, `authorizePermissions`, inline `authorizeRole` | Route definition |
| Controller role | Role gate inside controller | Controller |
| Ownership | Self / employer / admin scope in controller or service | Controller / service |

Before BE 006, `/api/v1/rbac` incorrectly re-exported the user router.
The obsolete route has now been removed and requests to `/api/v1/rbac/*` return 404.

## 3. Mount inventory

| Mount (`src/routes/index.js`) | Route module | Declarations |
|-------------------------------|--------------|-------------:|
| `/documents` | `document.routes.js` | 4 |
| `/health` | `health.routes.js` | 1 |
| `/auth` | `auth.routes.js` | 5 |
| `/shifts` | `shift.routes.js` | 9 |
| `/messages` | `message.routes.js` | 6 |
| `/admin` | `admin.routes.js` | 15 |
| `/availability` | `availability.routes.js` | 3 |
| `/users` | `user.routes.js` | 14 |
| `/branch` | `branch.routes.js` | 4 |
| `/attendance` | `shiftattendance.routes.js` | 3 |
| `/incidents` | `incident.routes.js` | 7 |
| `/notifications` | `notification.routes.js` | 6 |
| `/payroll` | `payroll.routes.js` | 6 |
| `/timesheets` | `timesheet.routes.js` | 3 |
| `/shift-requests` | `shiftrequest.routes.js` | 4 |
| `/equipment` | `equipment.routes.js` | 4 |
| `/emergency` | `emergency.routes.js` + `sos.route-set.js` | 8 |
| `/sos` | `sos.routes.js` + `sos.route-set.js` | 6 |
| **Subtotal (unique)** | | **108** |

**Not mounted:** `src/routes/dashboard.routes.js`, `src/routes/verification.routes.js`.

---

## 4. Draft RBAC route matrix

**Column values:** `Public` · `Yes` · `No` · `Self` · `Own employer records` · `All` · `Requires Product Owner decision` · `Requires technical correction`

For `/api/v1/rbac/*`, behaviour matches the corresponding `/api/v1/users/*` row (see Section 4.3).

### 4.1 Public and health

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/health` | Public | Public | Public | None | No Auth MW — `src/routes/health.routes.js:8` |
| POST | `/api/v1/auth/register` | Public | Public | Public | None | `src/routes/auth.routes.js:83` → `register` |
| POST | `/api/v1/auth/register/guard` | Public | Public | Public | None | Upload MW only — `src/routes/auth.routes.js:117` |
| POST | `/api/v1/auth/login` | Public | Public | Public | None | `src/routes/auth.routes.js:163` → `login` |
| POST | `/api/v1/auth/verify-otp` | Public | Public | Public | Issues JWT with role | `src/routes/auth.routes.js:189` → `verifyOTP` |
| POST | `/api/v1/auth/eoi` | Public | Public | Public | None | Upload MW — `src/routes/auth.routes.js:282` |
| POST | `/api/v1/admin/login` | Public | Public | Public | Controller requires admin after credentials | No Auth MW — `src/routes/admin.routes.js:63` → `adminLogin` |

### 4.2 Users (`/api/v1/users`)

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/users/me` | Self | Self | Self | Own profile | Auth MW + `loadUser` — `src/routes/user.routes.js:86` → `getMyProfile` |
| PUT | `/api/v1/users/me` | Self | Self | Self | Own profile | `src/routes/user.routes.js:87` → `updateMyProfile` |
| POST | `/api/v1/users/push-token` | Self | Self | Self | Own tokens | `src/routes/user.routes.js:120` → `registerPushToken` |
| GET | `/api/v1/users/profile` | No | Self | No | Controller role: employer only | Auth MW + `loadUser` only — `src/routes/user.routes.js:173`; controller check in `user.controller.js` |
| PUT | `/api/v1/users/profile` | No | Self | No | Controller role: employer only | `src/routes/user.routes.js:174` |
| GET | `/api/v1/users/favourites` | No | Self | No | Own favourites | Auth MW + `loadUser` — `src/routes/user.routes.js:189`; controller role check |
| POST | `/api/v1/users/favourites/:guardId` | No | Self | No | Own list | `src/routes/user.routes.js:214`; controller role check |
| DELETE | `/api/v1/users/favourites/:guardId` | No | Self | No | Own list | `src/routes/user.routes.js:237`; controller role check |
| GET | `/api/v1/users/guards` | No | Requires technical correction | Yes | Global guard list; `ROLES.EMPLOYEE` is undefined | Auth + `loadUser` + `authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE)` + `user:read` — `src/routes/user.routes.js:254`; `ROLES` in `src/middleware/rbac.js:11–18` |
| GET | `/api/v1/users/guards/:id/score` | Self | Yes | Yes | Self or employer/admin | Auth + `requireSelfOrRoles` — `src/routes/user.routes.js:288` |
| GET | `/api/v1/users/` | No | No | Yes | Admin-level list | Auth + roles including `SUPER_ADMIN`/`ADMIN`/`BRANCH_ADMIN` + `user:read` — `src/routes/user.routes.js:311` |
| GET | `/api/v1/users/:userId` | No | No | Yes | Admin get | `src/routes/user.routes.js:388` |
| PUT | `/api/v1/users/:userId` | No | No | Yes | Intended branch scope via `requireSameBranchAsTargetUser` | `src/routes/user.routes.js:395`; branch helper `src/middleware/rbac.js:143–185` |
| DELETE | `/api/v1/users/:userId` | No | No | Yes | Admin delete | `src/routes/user.routes.js:403` |

### 4.3 Historical `/api/v1/rbac` duplicate routes (removed in BE 006)

Before BE 006, the route was mounted from `src/routes/index.js` and re-exported `user.routes.js` through `src/routes/rbac.routes.js`. Both the mount and obsolete route file have now been removed.

Before BE 006 these endpoints duplicated `/api/v1/users/*`.

They have now been removed and requests return 404.

### 4.4 Shifts

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/shifts` | Yes | Yes | Yes | Role-scoped listing in controller | Auth + inline `authorizeRole` — `src/routes/shift.routes.js:190` |
| POST | `/api/v1/shifts` | No | Own employer records | No | Creates as employer | `src/routes/shift.routes.js:195` |
| PATCH | `/api/v1/shifts/:id` | No | Own employer records | All | `createdBy` or admin | `src/routes/shift.routes.js:203` |
| PUT | `/api/v1/shifts/:id/apply` | Self | No | No | Guard apply; ownership in service | `src/routes/shift.routes.js:301` |
| PUT | `/api/v1/shifts/:id/approve` | No | Own employer records | All | Owner or admin | `src/routes/shift.routes.js:384` |
| PUT | `/api/v1/shifts/:id/complete` | No | Own employer records | All | Owner or admin | `src/routes/shift.routes.js:410` |
| GET | `/api/v1/shifts/myshifts` | Self | Own employer records | All | Guard: applicants/acceptedBy; employer: `createdBy`; admin: unrestricted query (`shift.controller.js`) | Auth MW only — **no Role/Perm MW** — `src/routes/shift.routes.js:437` |
| PATCH | `/api/v1/shifts/:id/rate` | Self | Own employer records | No | Assigned guard / `createdBy` | `src/routes/shift.routes.js:485` |
| GET | `/api/v1/shifts/history` | Self | Own employer records | No | Role-scoped | `src/routes/shift.routes.js:505` |

### 4.5 Attendance

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| POST | `/api/v1/attendance/checkin/:shiftId` | Self | No | No | Must be `assignedGuard` (`attendance.service.js`) | Auth MW only — `src/routes/shiftattendance.routes.js:48` |
| POST | `/api/v1/attendance/checkout/:shiftId` | Self | No | No | Same assignment check | Auth MW only — `src/routes/shiftattendance.routes.js:87` |
| GET | `/api/v1/attendance/:userId` | Requires technical correction | Requires technical correction | Requires technical correction | **No requester ownership check** — loads by path `userId` | Auth MW only — `src/routes/shiftattendance.routes.js:143`; `shiftattendance.controller.js`; `attendance.service.js` |

### 4.6 Incidents

Router-level Auth MW: `src/routes/incident.routes.js:25`.

Incident routes use `authorizePermissions('incident:...')`. Seed scripts do not include `incident:*`. Fallback maps do. If Role documents were seeded from those scripts, permission middleware may deny access before controller ownership runs. Treat role outcomes as **Requires technical correction** until runtime Role documents are verified (Section 9).

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| POST | `/api/v1/incidents` | Requires technical correction | No | No | Guard must be `shift.acceptedBy` | Perm MW `incident:create` — `src/routes/incident.routes.js:132` |
| GET | `/api/v1/incidents` | Requires technical correction | Requires technical correction | Requires technical correction | Controller scopes by role | `incident:view` — `src/routes/incident.routes.js:133` |
| PATCH | `/api/v1/incidents/:id` | Requires technical correction | Requires technical correction | Requires technical correction | Guard / employer (owns shift) / admin field rules | `incident:update` — `src/routes/incident.routes.js:238` |
| GET | `/api/v1/incidents/:id` | Requires technical correction | Requires technical correction | Requires technical correction | Same scoping | `incident:view` — `src/routes/incident.routes.js:239` |
| DELETE | `/api/v1/incidents/:id` | No | No | Requires technical correction | Soft-delete; requires `incident:delete` | `src/routes/incident.routes.js:240` |
| POST | `/api/v1/incidents/:id/attachments` | Requires technical correction | Requires technical correction | Requires technical correction | Controller ownership + upload | `incident:update` — `src/routes/incident.routes.js:287` |
| GET | `/api/v1/incidents/:id/attachments/:attachmentId` | Requires technical correction | Requires technical correction | Requires technical correction | Controller ownership | `incident:view` — `src/routes/incident.routes.js:327` |

### 4.7 Emergency and SOS

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| POST | `/api/v1/emergency/sos` | Yes | No | No | Creates as authenticated guard | Auth + `allowRoles("guard")` — `src/routes/emergency.routes.js:56` |
| GET | `/api/v1/emergency/sos` | No | Own employer records | All | `buildScopedEmergencyQuery` | Auth + `allowRoles("admin","employer")` — `src/routes/emergency.routes.js:71` |
| GET | `/api/v1/emergency/sos/active` | Self | Own employer records | All | Scoped | `src/routes/sos.route-set.js:12` via `emergency.routes.js:73` |
| GET | `/api/v1/emergency/sos/:id` | Self | Own employer records | All | Scoped | `sos.route-set.js:18` |
| POST | `/api/v1/emergency/sos/:id/location` | Self | No | No | Guard-owned | `sos.route-set.js:24` |
| POST | `/api/v1/emergency/sos/:id/note` | Self | No | No | Guard-owned | `sos.route-set.js:30` |
| POST | `/api/v1/emergency/sos/:id/cancel` | Self | No | No | Guard-owned | `sos.route-set.js:31` |
| PUT | `/api/v1/emergency/sos/:id` | No | Own employer records | All | Scoped status transition | Auth + `allowRoles("admin","employer")` — `src/routes/emergency.routes.js:104` |
| POST | `/api/v1/sos/trigger` | Yes | No | No | Same create path | Auth + `allowRoles("guard")` — `src/routes/sos.routes.js:10` |
| GET | `/api/v1/sos/active` | Self | Own employer records | All | Scoped | `sos.route-set.js:12` via `sos.routes.js:11` |
| GET | `/api/v1/sos/:id` | Self | Own employer records | All | Scoped | `sos.route-set.js:18` via `sos.routes.js:11` |
| POST | `/api/v1/sos/:id/location` | Self | No | No | Guard-owned | `sos.route-set.js:24` via `sos.routes.js:11` |
| POST | `/api/v1/sos/:id/note` | Self | No | No | Guard-owned | `sos.route-set.js:30` via `sos.routes.js:11` |
| POST | `/api/v1/sos/:id/cancel` | Self | No | No | Guard-owned | `sos.route-set.js:31` via `sos.routes.js:11` |

### 4.8 Documents

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/documents/admin/documents` | No | All | All | **No employer filter** — all users with documents (`document.service.js`) | Auth + `authorizeRoles("admin","employer")` from `controllers/rbac.controller.js` — `src/routes/document.routes.js:49` |
| GET | `/api/v1/documents/admin/documents/:id` | No | All | All | No tenant ownership filter | `src/routes/document.routes.js:79` |
| PUT | `/api/v1/documents/admin/documents/:id` | Self | Requires technical correction | All | Service: admin **or document owner** only | Auth MW only — **no Role/Perm MW** — `src/routes/document.routes.js:120` |
| POST | `/api/v1/documents/admin/documents` | No | Self | Self | Controller forces `userId: req.user._id` | Auth + Role MW — `src/routes/document.routes.js:157` |

### 4.9 Equipment

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| POST | `/api/v1/equipment` | Requires technical correction | Requires technical correction | Requires technical correction | Any authenticated user may create | Auth MW only — `src/routes/equipment.routes.js:53` |
| PATCH | `/api/v1/equipment/:id/assign` | Requires technical correction | Requires technical correction | Requires technical correction | No ownership check | Auth MW only — `src/routes/equipment.routes.js:95` |
| PATCH | `/api/v1/equipment/:id/report` | Requires technical correction | Requires technical correction | Requires technical correction | No assignee/owner check | Auth MW only — `src/routes/equipment.routes.js:138` |
| GET | `/api/v1/equipment/guard/:guardId` | Requires technical correction | Requires technical correction | Requires technical correction | Any authenticated user may query any `guardId` | Auth MW only — `src/routes/equipment.routes.js:165–168` |

### 4.10 Payroll

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/payroll` | Self | Own employer records | All | Service-scoped (`payroll.service.js`) | Auth + inline `authorizeRole` — `src/routes/payroll.routes.js:87` |
| GET | `/api/v1/payroll/export` | Self | Own employer records | All | Same | `src/routes/payroll.routes.js:142` |
| GET | `/api/v1/payroll/export/csv` | Self | Own employer records | All | Same | `src/routes/payroll.routes.js:148` |
| GET | `/api/v1/payroll/export/pdf` | Self | Own employer records | All | Same | `src/routes/payroll.routes.js:154` |
| POST | `/api/v1/payroll/approve` | No | Own employer records | All | Employer record scope in service | `src/routes/payroll.routes.js:192` |
| POST | `/api/v1/payroll/process` | No | Own employer records | All | Same | `src/routes/payroll.routes.js:230` |

### 4.11 Messages

Router-level Auth MW: `src/routes/message.routes.js:14`.

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| POST | `/api/v1/messages` | Yes | Yes | No | Controller role pairing (guard↔guard, guard↔employer) | Auth MW only at router — `src/routes/message.routes.js:73` |
| GET | `/api/v1/messages/inbox` | Self | Self | Self | Receiver = self | `src/routes/message.routes.js:106` |
| GET | `/api/v1/messages/sent` | Self | Self | Self | Sender = self | `src/routes/message.routes.js:140` |
| GET | `/api/v1/messages/conversation/:userId` | Self | Self | Self | Messages involving current user | `src/routes/message.routes.js:184` |
| PATCH | `/api/v1/messages/:messageId/read` | Self | Self | Self | Receiver-only | `src/routes/message.routes.js:218` |
| GET | `/api/v1/messages/stats` | Self | Self | Self | Self counts | `src/routes/message.routes.js:244` |

### 4.12 Notifications

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/notifications/unread-count` | Self | Self | Self | Own | Auth + `loadUser` — `src/routes/notification.routes.js:45` |
| PATCH | `/api/v1/notifications/read-all` | Self | Self | Self | Own | `src/routes/notification.routes.js:59` |
| GET | `/api/v1/notifications` | Self | Self | Self | Own | `src/routes/notification.routes.js:98` |
| POST | `/api/v1/notifications` | No | Yes | Yes | Controller role allow-list; body `userId` not restricted to self | Auth + `loadUser` only — **no Role/Perm MW** — `src/routes/notification.routes.js:128`; `notification.controller.js` |
| GET | `/api/v1/notifications/:id` | Self | Self | Self | Own | `src/routes/notification.routes.js:143` |
| PATCH | `/api/v1/notifications/:id/read` | Self | Self | Self | Own | `src/routes/notification.routes.js:154` |

### 4.13 Admin (protected)

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/admin/users` | No | No | All | Global | Auth + `adminOnly` — `src/routes/admin.routes.js:80` |
| GET | `/api/v1/admin/users/:id` | No | No | All | Global | `src/routes/admin.routes.js:209` |
| DELETE | `/api/v1/admin/users/:id` | No | No | All | Blocks self-delete in controller | `src/routes/admin.routes.js:300` |
| GET | `/api/v1/admin/shifts` | No | No | All | Global | `src/routes/admin.routes.js:96` |
| GET | `/api/v1/admin/messages` | No | No | All | Global | `src/routes/admin.routes.js:261` |
| DELETE | `/api/v1/admin/messages/:id` | No | No | All | Soft-delete | `src/routes/admin.routes.js:337` |
| GET | `/api/v1/admin/audit-logs` | No | No | All | Global | `src/routes/admin.routes.js:157` |
| DELETE | `/api/v1/admin/audit-logs/purge` | No | No | All | Global | `src/routes/admin.routes.js:184` |
| GET | `/api/v1/admin/guards/pending` | No | No | All | Global | `src/routes/admin.routes.js:370` |
| PATCH | `/api/v1/admin/guards/:id/license/verify` | No | No | All | Global | `src/routes/admin.routes.js:400` |
| PATCH | `/api/v1/admin/guards/:id/license/reject` | No | No | All | Global | `src/routes/admin.routes.js:440` |
| GET | `/api/v1/admin/smtp-settings` | No | No | All | Global | `src/routes/admin.routes.js:458` |
| PUT | `/api/v1/admin/smtp-settings` | No | No | All | Global | `src/routes/admin.routes.js:504` |
| POST | `/api/v1/admin/smtp-settings/test` | No | No | All | Global | `src/routes/admin.routes.js:539` |

### 4.14 Branch, availability, timesheets, shift requests

| Method | Endpoint | Guard | Employer | Admin | Ownership rule | Middleware / evidence |
|--------|----------|-------|----------|-------|----------------|------------------------|
| GET | `/api/v1/branch/site` | No | Own employer records | No | `employerId: req.user.id` | Auth + `employerOnly` — `src/routes/branch.routes.js:93` |
| POST | `/api/v1/branch/site` | No | Own employer records | No | Sets employer identity on create | `src/routes/branch.routes.js:177` |
| PUT | `/api/v1/branch/site/:id` | No | Own employer records | No | Filtered by `employerId` | `src/routes/branch.routes.js:265` |
| DELETE | `/api/v1/branch/site/:id` | No | Own employer records | No | Same | `src/routes/branch.routes.js:303` |
| POST | `/api/v1/availability` | Self | Self | All | Non-admin may only target own user | Auth MW only — `src/routes/availability.routes.js:53` |
| GET | `/api/v1/availability/:userId` | Self | Self | All | Self or admin in controller | Auth MW only — `src/routes/availability.routes.js:77` |
| PATCH | `/api/v1/availability/status` | Self | Self | Self | Own status | Auth MW only — `src/routes/availability.routes.js:114` |
| POST | `/api/v1/timesheets/generate` | Yes | Yes | Yes | Role-scoped in service | Auth + `authorizeRoles` — `src/routes/timesheet.routes.js:12` |
| GET | `/api/v1/timesheets` | Self | Own employer records | All | Service filters | `src/routes/timesheet.routes.js:18` |
| GET | `/api/v1/timesheets/:id` | Self | Own employer records | All | Service filters | `src/routes/timesheet.routes.js:24` |
| POST | `/api/v1/shift-requests` | Self | No | No | Guard creates for self | Auth + `authorizeRoles('guard')` — `src/routes/shiftrequest.routes.js:15` |
| GET | `/api/v1/shift-requests` | Self | Own employer records | All | Employer shift scope in service | `src/routes/shiftrequest.routes.js:16` |
| GET | `/api/v1/shift-requests/:id` | Self | Own employer records | All | Scope check in service | `src/routes/shiftrequest.routes.js:20` |
| PATCH | `/api/v1/shift-requests/:id` | No | Own employer records | All | Employer must own shift scope | `src/routes/shiftrequest.routes.js:25` |

### 4.15 Unmounted route modules

| Method | Path if mounted | Status | Evidence |
|--------|-----------------|--------|----------|
| GET | `/api/v1/dashboard/stats` | Not mounted | `src/routes/dashboard.routes.js:70`; absent from `index.js` |
| POST | `/api/v1/verification/start` | Not mounted | `src/routes/verification.routes.js:43` |
| GET | `/api/v1/verification/status/:guardId` | Not mounted | `src/routes/verification.routes.js:48` |
| POST | `/api/v1/verification/recheck/:guardId` | Not mounted | `src/routes/verification.routes.js:53` |

Swagger may still document these files because it scans route modules under `src/routes/`.

---

## 5. Role name inconsistencies

| Issue | Evidence |
|-------|----------|
| User enum is `guard` / `employer` / `admin` only; Role collection and `ROLES` also define `super_admin`, `branch_admin`, `client` | `src/models/User.js`; `src/middleware/rbac.js`; seed scripts |
| `ROLES.EMPLOYEE` is referenced but not defined | `src/routes/user.routes.js:254`; `ROLES` object has no `EMPLOYEE` key |
| Swagger user-update enum includes `user` / `admin`, which does not match the User enum | `src/routes/user.routes.js` Swagger block |
| Notification create allow-list includes `super_admin` and `branch_admin` | `src/controllers/notification.controller.js` |
| Documentation mentions `employee` as unsupported in places | `docs/payroll-api-design.md`, `docs/system-architecture.md` — not a seeded Role name |
| Duplicate RBAC copies diverge (permission maps differ across files) | `src/middleware/rbac.js`, `src/controllers/rbac.controller.js`, `src/routes/rbac.routes.js` |

---

## 6. Documentation differences

| Documentation claim | Current repository behaviour |
|---------------------|------------------------------|
| `docs/rbac.md` previously documented `/api/v1/rbac`|
|The obsolete `/api/v1/rbac` route has been removed in BE 006|
| `docs/verification.md` documents `/api/verification/...` | Verification router is not mounted; Swagger annotations use `/api/v1/verification/...` |
| `docs/system-architecture.md` §9.1 omits timesheets, shift-requests, emergency and sos | Those mounts exist in `src/routes/index.js` |
| Document create Swagger implies arbitrary `userId` in the body | Controller overwrites `userId` with `req.user._id` |
| `docs/rbac.md` permission catalogue omits `incident:*` | Incident routes require `incident:*`; fallback map includes them; seed scripts do not |
| Architecture notes Swagger may document unmounted files | Confirmed for dashboard and verification |

---

## 7. Confirmed technical defects

These are confirmed from source. They are recorded for Product Owner and engineering review; this document does not change application code.

1. **`ROLES.EMPLOYEE` is undefined** on `GET /api/v1/users/guards` (`src/routes/user.routes.js:254`). Employers cannot pass the role middleware as written; only `admin` matches among intended roles.
2. **Attendance history IDOR:** `GET /api/v1/attendance/:userId` authenticates only; controller and service do not compare the requester to `userId` (`shiftattendance.routes.js`, `shiftattendance.controller.js`, `attendance.service.js`).
3. **Employer document listing is global:** `getAllDocuments` loads all users with documents and does not filter by employer (`document.service.js`); employer is allowed by role middleware (`document.routes.js`).
4. **Equipment routes lack role and ownership controls:** Auth MW only on create, assign, report and list-by-guard (`equipment.routes.js`, `equipment.controller.js`).
5. **Incident permissions diverge between seeds and fallback:** seeds lack `incident:*`; fallback includes them; DB Role documents win when present (`seedRoles.js`, `seed/data.js`, `middleware/rbac.js`).
6. **Verification and dashboard routers are not mounted** despite existing route files and possible Swagger coverage.
7. **Branch scoping references missing `User.branch`:** `requireSameBranchAsTargetUser` selects `branch` (`middleware/rbac.js`); `User` schema has no `branch` field.
8. **`PUT /api/v1/documents/admin/documents/:id` has no role middleware**; service allows admin or document owner only (employers without ownership are denied in service, but the route path and middleware are inconsistent with sibling document routes).
9. The obsolete `/api/v1/rbac` user-route alias was removed in BE 006, not a Role management API (`rbac.routes.js`).
10. **RBAC logic is duplicated** in middleware, `controllers/rbac.controller.js` and `routes/rbac.routes.js`, with permission-map drift; documents import authorisation from the controller copy.
11. **Several employer-only surfaces rely on controller role checks without route Role MW** (profile, favourites).
12. **Notification create** uses controller-only role checks and accepts an arbitrary target `userId`.
13. **`GET /api/v1/shifts/myshifts` has no Role/Perm MW**; admin receives an unrestricted query (all shifts).

---

## 8. Product Owner decisions required

| # | Decision |
|---|----------|
| 1 | Canonical role set: keep User enum (`guard` / `employer` / `admin`) only, or expand persistence to include `super_admin`, `branch_admin`, `client`? |
| 2 | Who may call `GET /api/v1/users/guards` (admin only, employers for marketplace, or another role)? |
| 3 | Documents: may employers list/manage all documents, or only own / tenant-scoped documents? May they create documents for other users? |
| 4 | Equipment: which roles may create, assign, report and list equipment? |
| 5 | Attendance history: self-only, employer-of-guard, admin-global, or another rule? |
| 6 | Availability `GET /:userId`: should employers read other users’ availability for scheduling? |
| 7 | `GET /api/v1/shifts/myshifts`: should admin retain unrestricted access; should Role MW be required? |
| 8 | Incidents: add `incident:*` to seeds, or replace permission middleware with role-based gates? |
| 9 | Resolved in BE 006: | the obsolete `/api/v1/rbac` mount has been removed. |
| 10 | Verification: mount under `/api/v1/verification` and which roles may start/recheck? |
| 11 | Branch admin: implement `User.branch` (or equivalent) and real tenancy, or remove branch-admin from the product model? |

---

## 9. Runtime verification items

Do **not** infer production database contents from this document. Confirm in the target environment:

| Item | Why it matters |
|------|----------------|
| Contents of the `Role` collection | Determines whether incident (and other) permission checks use seed values or fallback maps |
| Whether any user documents carry roles outside `guard` / `employer` / `admin` | Middleware references wider roles that the User enum rejects on save |
| Whether JWT payloads ever contain `super_admin`, `branch_admin` or `client` | Those strings are not valid on the User model enum |
| Live Express matching for `GET /api/v1/availability/status` vs `GET /:userId` | Declaration order can bind `status` as a `userId` for GET |
| Behaviour of duplicate RBAC copies at runtime if maps diverge further | Documents use the controller copy of `authorizeRoles` |

---

## 10. Reviewed source files

### Entry and mounts

- `server.js`
- `src/app.js`
- `src/routes/index.js`

### Route modules

- `src/routes/auth.routes.js`
- `src/routes/health.routes.js`
- `src/routes/user.routes.js`
- `src/routes/rbac.routes.js`
- `src/routes/shift.routes.js`
- `src/routes/shiftattendance.routes.js`
- `src/routes/shiftrequest.routes.js`
- `src/routes/incident.routes.js`
- `src/routes/emergency.routes.js`
- `src/routes/sos.routes.js`
- `src/routes/sos.route-set.js`
- `src/routes/document.routes.js`
- `src/routes/equipment.routes.js`
- `src/routes/payroll.routes.js`
- `src/routes/message.routes.js`
- `src/routes/notification.routes.js`
- `src/routes/admin.routes.js`
- `src/routes/branch.routes.js`
- `src/routes/availability.routes.js`
- `src/routes/timesheet.routes.js`
- `src/routes/dashboard.routes.js` (unmounted)
- `src/routes/verification.routes.js` (unmounted)

### Auth and RBAC

- `src/middleware/auth.js`
- `src/middleware/rbac.js`
- `src/middleware/role.js`
- `src/middleware/loadUser.js`
- `src/controllers/rbac.controller.js` (duplicate RBAC utilities; used by documents)

### Models and seeds

- `src/models/User.js`
- `src/models/Role.js`
- `src/models/Guard.js`
- `src/models/Employer.js`
- `src/models/Admin.js`
- `src/scripts/seedRoles.js`
- `src/scripts/seed/data.js`
- `src/scripts/seed/ids.js`

### Controllers and services (ownership / scope)

- Incident, shift, attendance, equipment, document, payroll, emergency, message, notification, user, availability and admin controllers/services as referenced in the matrix rows above

### Existing documentation and Swagger

- `docs/rbac.md`
- `docs/verification.md`
- `docs/system-architecture.md`
- `docs/payroll-api-design.md`
- `README.md`
- `src/config/swagger.js`

---

## 11. Verification notes (second pass)

| Topic | Outcome |
|-------|---------|
| Mounted route count | **108** unique; **122** including `/rbac` duplicates |
| /api/v1/rbac | Removed in BE 006. Requests now return 404 |
| Public endpoints | Role columns use `Public` (not “Yes”) |
| `GET /api/v1/shifts/myshifts` admin access | Confirmed **All** via unrestricted query when role is admin; missing Role MW remains a defect / Product Owner item |
| Seven priority defects | All confirmed (attendance IDOR, equipment auth-only, global document list, incident seed/fallback, `ROLES.EMPLOYEE`, unmounted verification/dashboard, missing `User.branch`) |

This matrix describes **current repository behaviour**. Aligning seeds, middleware, documentation and Product Owner decisions is out of scope for this document.
