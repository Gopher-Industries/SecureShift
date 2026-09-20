# BE004 - Audit Employer Data Access Boundaries

## Objective

The purpose of this investigation was to review selected backend routes and determine whether employers are able to access data that belongs to unrelated guards or employers. The review focused on the route middleware, controller logic and service-level ownership checks.

---

## Scope

The following backend areas were reviewed:

- Documents
- Emergency / SOS
- Equipment
- Verification

No production code was modified as part of this task.

---

## Review Method

Each area was reviewed by examining:

- Route middleware
- Controller logic
- Service ownership validation
- Role-based access control (RBAC)
- Whether access was restricted to the authenticated employer

---

# Audit Findings

| Area | Endpoint | Allowed Roles / Current Access | Current Ownership Check | Possible Access Risk | Required Policy | Fix Required |
|------|----------|-------------------------------|-------------------------|----------------------|-----------------|--------------|
| Documents | GET `/admin/documents` | Admin, Employer | No employer ownership filtering identified in the service. | Employers may retrieve documents belonging to unrelated employers. | Restrict results to documents belonging to the authenticated employer only. | Yes |
| Documents | GET `/admin/documents/:id` | Admin, Employer | No ownership validation was identified before returning a document by ID. | Employers may access documents that belong to another employer. | Validate ownership before returning the requested document. | Yes |
| Documents | PUT `/admin/documents/:id` | Any Authenticated User | Route middleware does not enforce role restrictions. The service performs some validation but access control is inconsistent. | Unauthorised users may attempt to update documents outside their ownership. | Apply consistent role and ownership validation at both the route and service layers. | Yes |
| Documents | POST `/admin/documents` | Admin, Employer | Controller replaces the supplied userId with the authenticated user's ID. | No cross-employer access issue was identified during this review. | Existing implementation is acceptable. | No |
| Emergency / SOS | GET `/sos` | Admin, Employer | Service filters records using employer-owned shifts. | No cross-employer access issue identified. | Continue enforcing employer ownership through shift records. | No |
| Emergency / SOS | GET `/sos/:id` | Guard, Employer, Admin | Scoped lookup validates ownership before returning the SOS record. | No cross-employer access issue identified. | Existing ownership validation is appropriate. | No |
| Emergency / SOS | POST `/sos` | Guard | The supplied shiftId is validated for format but not confirmed to belong to the requesting guard. | A guard could potentially reference an unrelated shift. | Validate shift ownership before creating the SOS record. | Yes (Minor) |
| Equipment | POST `/equipment` | Any Authenticated User | No role or ownership validation was identified. | Any authenticated user may create equipment records. | Restrict creation to authorised users and validate employer ownership. | Yes |
| Equipment | PATCH `/equipment/:id/assign` | Any Authenticated User | No employer ownership validation before assigning equipment. | Equipment could be assigned across employers. | Validate employer ownership before assigning equipment. | Yes |
| Equipment | PATCH `/equipment/:id/report` | Any Authenticated User | No ownership validation before updating equipment status. | Any authenticated user may update equipment belonging to another employer. | Restrict updates to authorised users within the same employer. | Yes |
| Equipment | GET `/equipment/guard/:guardId` | Any Authenticated User | No ownership validation before retrieving equipment records. | Equipment assigned to unrelated guards may be viewed. | Restrict access to guards belonging to the authenticated employer. | Yes |
| Verification | POST `/verification/start` | Any Authenticated User | No role or ownership validation for the supplied guardId. | Verification may be initiated for another employer's guard. | Validate requester role and employer ownership before creating verification records. | Yes |
| Verification | GET `/verification/status/:guardId` | Guard, Admin | Guards may only view their own verification status, while admins may view all. | No cross-employer access issue identified. | Existing ownership validation is appropriate. | No |
| Verification | POST `/verification/recheck/:guardId` | Guard, Admin | Guards may only recheck their own verification status, while admins may recheck all. | No cross-employer access issue identified. | Existing ownership validation is appropriate. | No |

---

# Summary

The review identified the following observations::

- The Documents module contains multiple areas where employer ownership validation could be improved.
- The Equipment module relies mainly on authentication and does not consistently enforce role or ownership checks.
- The Emergency/SOS module generally applies ownership validation correctly. A minor improvement would be validating that the supplied shift belongs to the requesting guard.
- The Verification module protects the status and recheck endpoints, however the verification start endpoint does not validate ownership of the supplied guard.

---

# Recommended Follow-up Tasks

The following follow-up work is recommended:

1. Add employer ownership validation to document endpoints.
2. Add role and ownership validation to equipment endpoints.
3. Restrict the verification start endpoint to authorised users only.
4. Validate shift ownership before creating SOS records.

---

## Overall Outcome

The review of the selected backend modules identified several confirmed and potential cross-employer access issues based on the current repository implementation. The Documents, Equipment and Verification modules contained areas where role or ownership validation could be improved. The Emergency/SOS module generally applied appropriate ownership validation, with one minor recommendation to validate shift ownership when creating SOS records.

No production code was modified as part of this investigation. The findings have been documented to support future remediation and follow-up work.

