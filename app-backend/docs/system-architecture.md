# SecureShift System Architecture

## 1. Overview

SecureShift is a multi-client security workforce platform composed of three main application areas:

- **Backend API** (`app-backend`) - Node.js and Express backend providing REST endpoints, authentication, business logic, and persistence.
- **Employer Panel** (`app-frontend/employer-panel`) - web frontend for employers and administrative workflows.
- **Guard App** (`guard_app`) - mobile client for guards, built with Expo / React Native.

The backend acts as the central integration point between the web and mobile clients, the database layer, and supporting services such as file uploads, notifications, and verification workflows.

---

## 2. Repository Structure

At a high level, the repository is organised into the following major areas:

- `app-backend`
  - backend service, API routes, controllers, models, middleware, configuration, and documentation
- `app-frontend/employer-panel`
  - employer-facing web frontend
- `guard_app`
  - guard-facing mobile application
- `docker-compose.yml`
  - local orchestration for backend, frontend, and database services

### Simplified Repository Layout

SecureShift/
├── app-backend/
│ ├── src/
│ │ ├── adapters/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── services/
│ │ └── utils/
│ └── docs/
├── app-frontend/
│ └── employer-panel/
├── guard_app/
└── docker-compose.yml

This reflects the high-level organisation of the system while omitting build artifacts and dependency directories (e.g. `node_modules`) for clarity.

Within the backend, the main source modules are organised under `app-backend/src`:

- `adapters` - external or specialised integration logic
- `config` - configuration such as database, uploads, and Swagger
- `controllers` - request handling logic
- `middleware` - authentication, RBAC, logging, and error handling
- `models` - MongoDB / Mongoose schemas
- `routes` - API endpoint definitions
- `scripts` - utility and seeding scripts
- `services` - business logic layer (currently limited)
- `utils` - reusable helpers such as crypto and email

---

## 3. Backend Architecture

The backend follows a modular Express architecture:

1. **Routes** define endpoint paths and attach middleware.
2. **Controllers** receive validated requests and coordinate workflow logic.
3. **Adapters / services** encapsulate specific integrations or subsystem behaviour.
4. **Models** persist and retrieve data using MongoDB via Mongoose.
5. **Middleware** enforces cross-cutting concerns such as authentication, permissions, logging, and error handling.

This creates a request flow of:

`Client -> Route -> Controller -> Adapter/Service -> Model -> Database`

The API is mounted under the versioned base path:

`/api/v1`

Swagger UI is exposed separately for API inspection and testing.

---

## 4. Endpoint Areas

The current backend exposes grouped endpoint areas through versioned REST routes. Based on the current route structure and Swagger configuration, key endpoint groups include:

- `auth`
- `admin`
- `availability`
- `branch`
- `dashboard`
- `messages`
- `rbac`
- `shifts`
- `shiftattendance`
- `users`
- `verification`
- `health`

Examples visible in the current API include:

- `POST /api/v1/verification/start`
- `GET /api/v1/verification/status/:guardId`
- `POST /api/v1/verification/recheck/:guardId`
- `PUT /api/v1/shifts/{id}/complete`

Swagger should be treated as the primary reference for the currently exposed API surface, while route files remain the source of implementation detail.

---

## 5. Database Schema Overview

The application uses MongoDB with Mongoose models representing core business entities. Key collections / models include:

- `User`
- `Guard`
- `Employer`
- `Admin`
- `Shift`
- `ShiftAttendance`
- `Availability`
- `Message`
- `AuditLogs`
- `EOI`
- `GuardVerification`
- `ManualVerification`

The previously created ERD remains useful as a high-level historical reference, but the current codebase should be treated as the authoritative source when documenting field-level details.

At a high level:

- `User` provides the shared account base
- `Guard`, `Employer`, and `Admin` extend user-related role information
- `Shift` stores work opportunities, assignments, status, and ratings
- `ShiftAttendance` records check-in/check-out data
- `Availability` records guard availability
- `Message` stores direct communication between users
- `GuardVerification` stores licence verification snapshots
- `ManualVerification` stores manual review records for non-automated jurisdictions

---

## 6. Verification Subsystem Mapping

The verification subsystem is explicitly documented in `verification.md` and implemented in code across adapters, controllers, routes, models, and utilities.

### Intended Design

The documented verification workflow defines:

- **NSW** -> automatic licence verification through the NSW Security API
- **Other jurisdictions** -> manual verification workflow
- encrypted licence handling
- verification status and recheck endpoints

### Code Mapping

| Design concept | Code location |
|---|---|
| Verification routes | `src/routes/verification.routes.js` |
| Verification controller | `src/controllers/verification.controller.js` |
| NSW adapter | `src/adapters/verification/nswAdapter.js` |
| Manual adapter | `src/adapters/verification/manualAdapter.js` |
| Verification snapshot model | `src/models/GuardVerification.js` |
| Manual review model | `src/models/ManualVerification.js` |
| Licence encryption utility | `src/utils/crypto.js` |

### Verification Interaction Flow

For a request such as:

`POST /api/v1/verification/start`

the interaction flow is:

`client -> verification route -> verification controller -> NSW adapter or manual adapter -> GuardVerification / ManualVerification model -> MongoDB`

This subsystem is a clear example of the backend’s modular route-controller-adapter-model architecture.

---

## 7. Documentation-to-Code Deltas

Several differences were identified between the existing verification documentation and the current implementation:

1. **API base path**
   - Existing documentation describes verification endpoints under `/api/verification/...`
   - Current backend routing is versioned under `/api/v1/...`

2. **Model detail mismatch**
   - The code contains additional schema detail not fully reflected in the documentation, including extra fields and enum values in the verification models.

3. **Manual workflow completeness**
   - The documentation describes a fuller manual approval workflow than is currently implemented in the exposed backend logic.
   - Some manual review steps appear planned or only partially implemented.

4. **Security policy gap**
   - Documentation states that only admins manage manual verification records.
   - Current implementation should be reviewed to confirm that this rule is fully enforced through middleware and controller logic.

These deltas could be treated as maintenance items for future documentation refinement.

---

## 8. Current Observations and Issues

During local environment validation, the following current-state observations were identified:

- `guard_app/.env` is no longer tracked in the current main branch, so local guard app environment configuration must be recreated manually.
- The employer frontend currently fails to compile in Docker due to a missing stylesheet import:
  - `createShift.js` imports `./createShift.css`
  - the stylesheet file is not present in the current branch
- This suggests a frontend asset rename/removal inconsistency that should be resolved separately from this documentation task.
- Local development may encounter port conflicts on `5000` when running Docker Compose alongside other services.
- In such cases, the backend container may need to be remapped (e.g. to `5001`) to allow successful startup.
- This suggests a need for clearer environment setup guidance or configurable port defaults.

These findings are not blockers for backend architecture documentation, but they are relevant to the current system state.

---

## 9. Existing Diagrams and Documentation Strategy

Legacy architecture and ERD diagrams from a previous trimester remain useful as reference material. However, because the current codebase is still evolving, fully regenerating UML and ERD assets immediately is likely to create documentation churn.

For the current task, the preferred strategy is:

- document the **current module structure**
- document the **current endpoint groupings**
- document the **current schema concepts**
- document the **current subsystem interactions**
- defer full diagram regeneration until later in the trimester when the codebase stabilises

This approach prioritises accuracy over presentation polish.

---

## 10. Recommendations

1. Add short documentation breadcrumbs in verification-related backend files linking code to `verification.md`
2. Align verification documentation with the `/api/v1` API base path
3. Document which parts of the manual verification workflow are implemented versus planned
4. Fix the employer frontend `createShift.css` import inconsistency
5. Regenerate architecture and database diagrams after feature churn slows later in the trimester

---

## 11. Summary

SecureShift uses a modular backend architecture that separates routes, controllers, adapters, models, middleware, and utilities. The current repository structure and verification subsystem provide a strong basis for maintainable in-repo architecture documentation.

The most important immediate documentation need is not a polished diagram set, but an accurate mapping of current modules, endpoints, schema concepts, and interactions to the actual codebase.