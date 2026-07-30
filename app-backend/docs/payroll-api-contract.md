# Payroll API Contract

All endpoints are under `/api/v1/payroll` and require a valid JWT bearer token.



## Access Control

All routes use the `auth` middleware to validate the bearer token and attach `req.user`.
Role-based scoping is then enforced per endpoint:

- admin: full access across all guards and employers
- employer: can only access payroll for shifts they created
- guard: can only access their own payroll records



## Endpoints

### GET /api/v1/payroll

Retrieves payroll records for a given date range. Accessible by admin, employer and guard.

Required query params:
- `startDate` — date in YYYY-MM-DD format
- `endDate` — date in YYYY-MM-DD format
- `periodType` — one of `daily`, `weekly`, or `monthly`

Optional query params:
- `guardId` — filter to a specific guard (guards can only pass their own ID)
- `department` — filter by department; maps to `Shift.field` internally

Example:
```
GET /api/v1/payroll?startDate=2026-07-01&endDate=2026-07-31&periodType=weekly
```

Successful response (200) returns an array of payroll documents. Each document includes the guard and employer reference, period bounds, hour breakdowns (scheduled, actual, payable, ordinary, overtime), amounts, current status, and an entries array with per-shift detail.

Common errors:
- 400 if any required param is missing, a date is not valid YYYY-MM-DD, periodType is not recognised, or startDate is after endDate
- 401 if no token is provided
- 403 if the role is not permitted or a guard tries to access another guard's data
- 500 on unexpected failure



### GET /api/v1/payroll/export

Exports payroll data as a file download. Accessible by admin, employer and guard.

Takes the same query params as the retrieval endpoint above, plus one additional required param:
- `format` — either `csv` or `pdf`

This endpoint delegates to `/export/csv` or `/export/pdf` depending on the format value. If `format` is missing or anything other than `csv` or `pdf`, the server returns a 400.

Example:
```
GET /api/v1/payroll/export?startDate=2026-07-01&endDate=2026-07-31&periodType=monthly&format=csv
```



### GET /api/v1/payroll/export/csv

Direct CSV export. Accessible by admin, employer and guard.

Takes the same query params as the retrieval endpoint (no `format` param needed).

On success (200), returns a CSV file download with headers:
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="payroll.csv"`



### GET /api/v1/payroll/export/pdf

Direct PDF export. Accessible by admin, employer and guard.

Takes the same query params as the retrieval endpoint (no `format` param needed).

On success (200), returns a PDF file download with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="payroll.pdf"`



### POST /api/v1/payroll/approve

Bulk-approves payroll records. Accessible by admin and employer only.

Request body:
```json
{
  "payrollIds": ["<ObjectId>", "<ObjectId>"]
}
```

`payrollIds` must be a non-empty array. Records must be in `PENDING` status to be approved.

Successful response (200):
```json
{
  "message": "Payroll approved successfully",
  "payroll": []
}
```

Common errors:
- 400 if `payrollIds` is missing or empty
- 401 if no token is provided
- 403 if the role is not permitted
- 409 if a payroll record is not in a valid state for this transition
- 500 on unexpected failure



### POST /api/v1/payroll/process

Bulk-processes payroll records. Accessible by admin and employer only.

Request body:
```json
{
  "payrollIds": ["<ObjectId>", "<ObjectId>"]
}
```

`payrollIds` must be a non-empty array. Records must be in `APPROVED` status to be processed.

Successful response (200):
```json
{
  "message": "Payroll processed successfully",
  "payroll": []
}
```

Common errors are the same as the approve endpoint above.



## Payroll Status Lifecycle

Records move through three statuses in order: `PENDING` -> `APPROVED` -> `PROCESSED`. 

A new payroll record starts as PENDING. It must be approved before it can be processed. Attempting to skip or reverse a step returns a 409.



## Known Frontend Integration Notes

- The `/export` endpoint requires a `format` param. Calling it without one returns a 400. Use `/export/csv` or `/export/pdf` directly if you want to avoid passing `format`.
- The `department` filter maps to `Shift.field` on the backend, not a field called department. Frontend values must match what is stored in the shift record.
- Guards cannot supply a `guardId` belonging to another guard. The backend enforces this and returns a 403.
- The export endpoints return a binary stream, not JSON. The frontend must handle the response as a Blob and trigger a file download.
- There is no pagination on the retrieval endpoint. Large date ranges may return large payloads.
- Always check payroll status before showing approve or process actions in the UI. Sending an out-of-order request returns a 409.
