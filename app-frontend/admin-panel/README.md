# SecureShift — Admin Panel (Frontend)

Web admin console for SecureShift, built with Create React App (react-scripts 5), React 19,
react-router v7 and Axios — mirroring the Employer Panel conventions.

Use the [root full-stack quickstart](../../README.md) for Compose setup and
Mailpit OTP. The backend defaults to port 5000; use 5001 in your API URL if
configured. No private credentials are required for local Compose.

## Host development

Run these from the repository root after starting the backend. Copy the template
only on first setup; set `REACT_APP_API_BASE_URL` to your backend's `/api/v1` URL.
Use Node 22.13+ for a shared local toolchain (backend minimum: 22.13.0).

```bash
cd app-frontend/admin-panel
cp .env.example .env        # set REACT_APP_API_BASE_URL if not localhost:5000
npm ci
npm start                   # runs on http://localhost:3001 (default; set via cross-env)
```

Runs on **port 3001 by default** (so it sits alongside the Employer Panel on 3000). Requires the backend running (default `http://localhost:5000/api/v1`). Log in at `/login`
with an **admin** account (backend `POST /api/v1/admin/login`); non-admins are redirected out.

## Structure

```
src/
├─ pages/        AdminLogin, AdminDashboard, Users, UserDetails, GuardVerification,
│                Shifts, AuditLogs, Messages, SMTPSettings
├─ components/   AdminSidebar, AdminNavbar, DataTable, Modal, SearchFilter, LoadingComponent
├─ layouts/      AdminLayout (sidebar + navbar + content outlet)
├─ routes/       adminRoutes (route table), ProtectedRoute (admin-only guard)
├─ service/      adminAPI (all admin endpoint calls)
├─ hooks/        useAdminAuth (login/logout/session)
├─ utils/        authentication (token/role helpers, isAdmin)
└─ lib/          http (Axios instance, token attach, 401 handler)
```

## Historical Sprint 1 status (foundation)

This is an earlier handover snapshot, not the current implementation inventory.

Built: project structure, admin-only auth + protected routing, dashboard nav shell,
shared API client, and one working data view (**Users** → `GET /admin/users`).
Remaining pages are placeholders wired into navigation, to be built in Sprint 2.

## Backend admin API inventory (`/api/v1/admin`)

| Area               | Endpoint                                                                                                        | Status    |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | --------- |
| Auth               | `POST /admin/login`                                                                                             | Available |
| Users              | `GET /admin/users`, `GET /admin/users/:id`, `DELETE /admin/users/:id`                                           | Available |
| Guard verification | `GET /admin/guards/pending`, `PATCH /admin/guards/:id/license/verify`, `PATCH /admin/guards/:id/license/reject` | Available |
| Shifts             | `GET /admin/shifts`                                                                                             | Available |
| Audit logs         | `GET /admin/audit-logs`, `DELETE /admin/audit-logs/purge`                                                       | Available |
| Messages           | `GET /admin/messages`, `DELETE /admin/messages/:id`                                                             | Available |
| SMTP config        | `GET /admin/smtp-settings`, `PUT /admin/smtp-settings`, `POST /admin/smtp-settings/test`                        | Available |

## Docker (optional)

The root `docker-compose.yml` already includes the `frontend-admin` service. From the repository root:

```bash
docker compose up -d frontend-admin
docker compose logs frontend-admin
docker compose ps -a
```
