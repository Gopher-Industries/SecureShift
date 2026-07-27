# Contributing — SecureShift Admin Panel

Foundation is in place (auth, routing, layout, shared API client, reusable components).
Follow these conventions so we can work in parallel without stepping on each other.

## Branching
- Base branch: `frontend/admin-panel`.
- Feature branches: `username/feature/<page-or-topic>` (e.g. `krisha/feature/audit-logs`).
- One PR per ticket. PRs target `frontend/admin-panel` and need one review before merge.

## Where things go
- `pages/`      one file per screen (own your ticket's page here)
- `components/` reusable UI only (DataTable, Modal, SearchFilter, LoadingComponent)
- `layouts/`    app shell (sidebar/navbar) — don't duplicate
- `routes/`     route table + ProtectedRoute
- `service/`    ALL backend calls go through `adminAPI.js` — never call axios directly in a page
- `hooks/`, `utils/`, `lib/`  shared logic (auth, http)

## How to build a page (standard pattern)
1. Add your API call(s) to `service/adminAPI.js`.
2. In your page: `useEffect` → call the service → handle **loading / error / empty** states.
3. Render lists with `<DataTable/>`, filters with `<SearchFilter/>`, dialogs with `<Modal/>`.
4. No mock or hardcoded data — use real endpoints (or leave the page as a placeholder if the endpoint is missing, and flag it as a backend dependency).

## Before opening a PR
- `npm run lint` passes.
- Page handles loading/error/empty.
- No secrets committed (`.env` is git-ignored).
