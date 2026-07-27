# Guard App - API Contract Audit

## Introduction

As part of this task, I reviewed all the API modules in the Guard App and checked them against the current backend. The goal was to make sure every API call the app makes matches a real backend route, and to flag any mock data, wrong paths, or mismatched fields. This is important because if the app calls an endpoint that does not exist or sends the wrong data, that feature will fail when it talks to the real backend.

## How I checked

I went through each module in `guard_app/src/api` one by one. For every call I compared the method, the path, and the fields against the backend routes in `app-backend/src/routes`. The table below shows the result for each module, and after it I explain the problems that need follow-up.

## Module check results

| Module | Calls | Backend match | Status |
|--------|-------|---------------|--------|
| attendance | `POST /attendance/checkin/:shiftId`, `POST /attendance/checkout/:shiftId`, `GET /attendance/:userId` | All exist | OK |
| auth | `POST /auth/register/guard`, `POST /auth/login`, `POST /auth/verify-otp`, `GET /users/me` | All exist | OK |
| shifts | `GET /shifts`, `GET /shifts/myshifts`, `PUT /shifts/:id/apply` | All exist | OK |
| messages | `GET /messages/inbox`, `/sent`, `/conversation/:userId`, `POST /messages`, `PATCH /messages/:id/read` | All exist | OK |
| notification | `GET /notifications`, `/unread-count`, `/:id`, `POST /notifications`, `PATCH /read-all`, `/:id/read` | All exist | OK |
| profile | `GET /users/me`, `PUT /users/me` | All exist | OK |
| pushTokens | `POST /users/push-token` | Exists | OK |
| guardScore | `GET /users/guards/:id/score` | Exists | OK |
| home | `GET /users/me`, `GET /shifts/myshifts` (with `?date=`) | Paths exist, but `?date=` and array handling have issues | Needs fix |
| payroll | `GET /payroll`, `GET /payroll/export` | Path exists but export call is missing a required param | Needs fix |
| availability | `POST /availability`, `GET /availability/:userId` + 4 slot calls | Base calls exist, slot calls do not exist on backend | Needs backend work |
| sos | `/sos/trigger`, `/sos/:id/location`, `/note`, `/cancel`, `GET /sos/:id` | Running on mock data, and real paths are wrong | Needs fix |

## Problems found

### 1. Availability slot endpoints do not exist on the backend

`availability.ts` calls four calendar-slot endpoints:

- `POST /availability/slots`
- `GET /availability/slots/my-slots`
- `DELETE /availability/slots/:id`
- `DELETE /availability/slots/clear-all`

The backend only has `POST /availability`, `GET /availability/:userId`, and `PATCH /availability/status`. None of the slot routes exist, so these calls will fail with 404. This gap must be raised with the Backend team.

### 2. SOS module is on mock data and uses wrong paths

`sos.ts` has `USE_MOCK_SOS = true`, so all SOS actions return fake data, not the backend. The real (non-mock) paths in the file are also wrong: it calls `/sos/trigger`, `/sos/:id/location`, `/sos/:id/note`, `/sos/:id/cancel`, `GET /sos/:id`. The backend SOS routes live under `/emergency`: `POST /emergency/sos`, `GET /emergency/sos`, `PUT /emergency/sos/:id`. The backend also does not have per-alert location/note/cancel or a guard status-poll route, so the feature set does not match.

### 3. Payroll CSV export is missing a required query param

`exportPayrollCsv` builds the URL with `startDate`, `endDate`, `periodType` only. The backend `GET /payroll/export` requires a `format` param (`csv` or `pdf`). Without it the export will fail. Fix: add `format=csv`, or call the dedicated `GET /payroll/export/csv` route.

### 4. home.ts uses an unsupported query param and unsafe array handling

- `getTodayShifts` sends `GET /shifts/myshifts?date=...`, but the backend only supports `?status=past`. The `date` filter is ignored, so it does not return today's shifts only.
- `getUpcomingShifts` calls `data.filter(...)` directly and assumes the response is an array. Other modules (like `shifts.ts`) normalize the response first. If the backend wraps the list in an object, this breaks.

### 5. availability upsert sends the wrong field name (minor)

`upsertAvailability` sends `userId` in the body, but the backend reads the field as `user`. For a guard using their own token this still works (the field is ignored), but the names should match to avoid confusion.

## Conclusion

7 of 12 modules match the backend cleanly. Availability slots is the main gap and must be requested from Backend. SOS needs real endpoints and correct paths. Payroll export and home have smaller fixes. All issues are logged as follow-up tickets.
