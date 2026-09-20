# BE016 - Verify the Employer Incident API Contract

## Objective

The purpose of this task was to review the current incident API and confirm that employers can view and update incidents through the Employer Panel. The review focused on listing incidents, viewing one incident, updating its status and viewing attachments.

This was a documentation and verification task, so no production code was changed.

---

## Files Reviewed

The following backend files were reviewed:

- `src/routes/incident.routes.js`
- `src/controllers/incident.controller.js`
- `src/models/Incident.js`
- `src/middleware/rbac.js`
- `tests/incident.controller.test.js`

---

## Employer Access and Permissions

All incident routes require the user to be logged in with a valid bearer token. Employers need the `incident:view` permission to view incidents and attachments, and the `incident:update` permission to update an incident. Both permissions are included in the default employer role in `rbac.js`.

Employer access is limited using the shift linked to the incident. The system checks that the shift's `createdBy` value matches the ID of the logged-in employer. This means an employer should only be able to access incidents connected to shifts they created.

---

## Endpoint Summary

| Employer action | Method and endpoint | Permission | Expected result |
| --- | --- | --- | --- |
| List incidents | `GET /api/v1/incidents` | `incident:view` | Returns the employer's incidents |
| View one incident | `GET /api/v1/incidents/{id}` | `incident:view` | Returns one incident |
| Update incident status | `PATCH /api/v1/incidents/{id}` | `incident:update` | Returns the updated incident |
| View/download attachment | `GET /api/v1/incidents/{id}/attachments/{attachmentId}` | `incident:view` | Returns the requested file |

---

## 1. List Incidents

**Endpoint:** `GET /api/v1/incidents`

This endpoint returns a list of incidents. If an employer does not provide a `shiftId`, the API returns incidents connected to all shifts created by that employer. If a `shiftId` is provided, the API applies the filter only when that shift belongs to the logged-in employer. If the supplied `shiftId` belongs to another employer, the query returns no incidents.

The following optional filters can be used:

- `shiftId`
- `guardId`
- `severity` - `low`, `medium` or `high`
- `status` - `SUBMITTED`, `IN_REVIEW` or `RESOLVED`
- `startDate`
- `endDate`

No request body is required.

### Example Request

```bash
curl -H "Authorization: Bearer <employer-token>" "http://localhost:5000/api/v1/incidents?shiftId=shift123&status=IN_REVIEW&severity=high"
```

### Example Successful Response

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "incident123",
      "shiftId": {
        "_id": "shift123",
        "createdBy": "employer123"
      },
      "guardId": {
        "_id": "guard123"
      },
      "severity": "high",
      "description": "Unauthorized access detected",
      "status": "IN_REVIEW",
      "recordedAt": "2026-08-30T10:00:00.000Z",
      "attachments": []
    }
  ]
}
```

The expected errors are:

- `400` - Invalid status filter
- `401` - User is not authenticated
- `403` - User does not have the required permission

---

## 2. View One Incident

**Endpoint:** `GET /api/v1/incidents/{id}`

The incident ID is required in the URL. No request body is required.

A successful request returns the incident details, including:

- Shift details
- Guard details
- Severity
- Description
- Incident status
- Location
- Date and time information
- Attachment information

### Example Request

```bash
curl -H "Authorization: Bearer <employer-token>" "http://localhost:5000/api/v1/incidents/incident123"
```

The expected errors are:

- `401` - User is not authenticated
- `403` - The incident is linked to a shift created by another employer
- `404` - The incident does not exist or has been deleted

---

## 3. Update an Incident Status

**Endpoint:** `PATCH /api/v1/incidents/{id}`

The incident ID is required in the URL. An employer can update the `status` and `description` fields. Other fields are not available to the employer.

The allowed status order is:

```text
SUBMITTED -> IN_REVIEW -> RESOLVED
```

An incident cannot move backwards, skip a step or be changed again after it has been resolved.

### Example Request

```bash
curl -X PATCH -H "Authorization: Bearer <employer-token>" -H "Content-Type: application/json" -d '{"status":"IN_REVIEW"}' "http://localhost:5000/api/v1/incidents/incident123"
```

### Example Request Body

```json
{
  "status": "IN_REVIEW"
}
```

A successful request returns the updated incident.

The expected errors are:

- `400` - Invalid status or invalid status change
- `401` - User is not authenticated
- `403` - The incident belongs to another employer
- `404` - The incident does not exist or has been deleted

---

## 4. View or Download an Attachment

**Endpoint:** `GET /api/v1/incidents/{id}/attachments/{attachmentId}`

The incident ID and attachment ID are both required in the URL. No request body is required.

Attachment IDs and other attachment information are included in the incident response.

### Example Request

```bash
curl -L -H "Authorization: Bearer <employer-token>" -o evidence.pdf "http://localhost:5000/api/v1/incidents/incident123/attachments/attachment123"
```

If the request is successful, the API returns the stored file as a download.

The expected errors are:

- `401` - User is not authenticated
- `403` - The incident belongs to another employer
- `404` - The incident or attachment cannot be found

---

## Findings

The review confirmed that all four employer functions requested in the ticket are available. The employer ownership checks are included in the controller and are based on the employer who created the related shift.

The following gaps were identified:

1. Swagger lists the status codes but does not include detailed response formats or response examples.
2. Swagger does not clearly explain that employer access is checked using `Shift.createdBy`.
3. There is no separate endpoint for listing attachments. Attachment details are included inside the incident response instead.
4. The incident list does not currently include pagination or a documented sorting order.
5. The date filters are converted into dates without clear validation for invalid dates.
6. The default employer permissions are documented in `rbac.js`, but database role settings may override them.
7. The existing incident controller test did not run successfully because Jest returned `ReferenceError: require is not defined`.
8. No tests were executed, and the current test file does not test employer access boundaries.

---

## Recommended Follow-up Tasks

1. Fix the Jest and ES-module setup.
2. Add tests for employers accessing incidents linked to their own shifts.
3. Add tests confirming employers cannot access another employer's incidents.
4. Add Swagger response formats and examples for the incident endpoints.
5. Clearly document the employer ownership rule in Swagger.
6. Add validation for invalid date filters.
7. Confirm what should happen when `startDate` is later than `endDate`.
8. Confirm whether pagination and sorting are required for the Employer Panel.

---

## Verification Evidence

The contract was checked against the incident routes, controller, model and RBAC files listed above.

The employer `shiftId` filtering behaviour was rechecked after PR#636 was merged. The updated controller keeps the requested `shiftId` only when it matches one of the authenticated employer's shifts. If no `shiftId` is provided, incidents from all employer-owned shifts can be returned.

The Swagger comments in `incident.routes.js` were also reviewed to confirm:

- The available routes
- Request parameters
- Required permissions
- Expected response status codes
- Authentication requirements

The following test command was run:

```bash
npm test -- --runTestsByPath tests/incident.controller.test.js
```

The test suite failed before running any tests with:

```text
ReferenceError: require is not defined
```

The result showed one failed test suite and zero tests completed.

As this ticket requires a documentation-only pull request, the test setup was not changed. The issue has instead been recorded as a recommended follow-up task.

---

## Overall Outcome

The current API provides the main functions required by the Employer Panel. Employers can list incidents, view an individual incident, update its status and download attachments.

The access checks generally restrict employers to incidents connected to shifts they created. The main areas requiring improvement relate to Swagger documentation, date validation, pagination and automated testing of employer access.