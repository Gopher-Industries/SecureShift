# Payroll API Design

## Overview


This endpoint was implemented as a backend placeholder for payroll processing and reporting in SecureShift.

The goal of this API is to aggregate completed shift data and attendance records so the system can return payroll-related summaries for guards and employees. It is designed to support future payroll processing logic without implementing a full payroll engine at this stage.

Endpoint:

`GET /api/v1/payroll`

## Purpose

The payroll endpoint provides a summary view of worked shifts for a selected date range. It is intended to prepare the backend for future payroll features such as overtime policies, allowances, penalties, approvals, exports, and reporting dashboards.

This implementation focuses on:

- retrieving completed shifts
- retrieving matching attendance records
- calculating worked hours from check-in and check-out times
- flagging incomplete attendance for review
- returning per-guard and per-period summaries

## Request Parameters

The endpoint accepts the following query parameters:

- `startDate` required
- `endDate` required
- `periodType` required, must be `daily`, `weekly`, or `monthly`
- `guardId` optional
- `site` optional
- `department` optional

Example request:

http
GET /api/v1/payroll?startDate=2026-03-01&endDate=2026-03-31&periodType=weekly

## Security

The endpoint is protected by authentication middleware.

Route:

router.get("/", auth, getPayrollSummary);

This means a valid bearer token is required to access payroll data.

## Data Sources

This placeholder implementation currently uses two backend models:

Shift

ShiftAttendance

Shift model

Used to retrieve scheduled and completed shift records, including:

shift date

start time

end time

location

assigned guard

shift status

ShiftAttendance model

Used to retrieve actual attendance timestamps, including:

checkInTime

checkOutTime

## Current Logic
1. Input validation

The service validates:

startDate is present

endDate is present

periodType is present

periodType is one of daily, weekly, or monthly

startDate is not after endDate

Invalid requests return an error response.

2. Completed shift retrieval

The API queries the Shift model for records that match:

status = completed

date within the requested range

Optional filters can be applied for:

guard

site

3. Attendance lookup

For every matching shift, the API retrieves attendance records from ShiftAttendance using shiftId.

4. Worked hours calculation

If both checkInTime and checkOutTime exist:

worked hours = checkOutTime - checkInTime

If one or both are missing:

the shift is flagged as pending_review

5. Overtime placeholder

A simple placeholder overtime rule is currently used:

overtime hours = worked hours above 8 hours per shift

This is only a temporary rule and is expected to be replaced by configurable payroll policy later.

6. Underworked shift placeholder

If scheduled hours can be derived and actual worked hours are lower than scheduled hours:

the shift is flagged as underworked

7. Per-guard summaries

The API aggregates payroll metrics by guard, including:

total shifts

total hours

overtime hours

underworked shifts

pending approval count

8. Per-period summaries

The API groups payroll data by the requested periodType:

daily

weekly

monthly

Response Structure

The current response includes:

filters

summary

guards

periods

payrollDetails

Example shape:

{
  "filters": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "periodType": "weekly",
    "guardId": null,
    "site": null,
    "department": null
  },
  "summary": {
    "totalCompletedShifts": 0,
    "totalAttendanceRecords": 0,
    "totalGuards": 0,
    "totalHours": 0,
    "totalOvertimeHours": 0,
    "totalPendingApproval": 0
  },
  "guards": [],
  "periods": [],
  "payrollDetails": []
}
## Current Limitations

This endpoint is intentionally a placeholder and does not yet implement a full payroll engine.

Therefore there are some limitations such as:

no pay rate multiplication yet

no wage calculation yet

no configurable overtime rules yet

no allowances, penalties, or bonus logic yet

no CSV or PDF export yet

department filtering is included as an API parameter, but depends on whether department data exists in the underlying shift model

guard name population may need improvement depending on how user data is linked

local testing currently returns empty payroll summaries because no shift records were present in the connected development MongoDB instance during testing

## Known Testing Notes

During development:

the endpoint route was confirmed to be mounted correctly

Swagger documentation was added successfully

authentication protection was confirmed through 401 Access denied. No token provided. when no bearer token was supplied

validation logic was confirmed using valid and invalid query parameter tests

local MongoDB currently contains no matching shift data, so summaries return empty arrays and zero totals

Planned Future Improvements

Suggested future improvements:

add role-based access so only employer/admin users can retrieve payroll summaries

calculate wages using shift pay rate and worked hours

support configurable overtime rules

support penalties, allowances, and bonus calculations

populate guard names from the user collection

support CSV and PDF export

add automated unit and integration tests

extend filtering to department once supported in the data model

# Logic Flow
Client Request
   ↓
GET /api/v1/payroll
   ↓
Route Layer
   ↓
Auth Middleware
   ↓
Payroll Controller
   ↓
Payroll Service
   ↓
Query Shift model
   ↓
Query ShiftAttendance model
   ↓
Calculate hours and placeholders
   ↓
Aggregate by guard and period
   ↓
Return JSON response

# Summary

This implementation provides the backend structure for payroll reporting and future payroll processing. It is intentionally scoped as a placeholder API, with enough logic to validate request parameters, retrieve shift and attendance data, calculate base worked hours, and prepare summaries for later expansion.