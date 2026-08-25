Guard Licence Verification
📌 Overview

Guards must hold a valid licence before accepting shifts.
NSW → auto-verification via NSW Security API (OAuth).
Other states → manual verification workflow for admins.

-------------------------------------------------------------------------------------------------------------------------------------------

⚙️ Structure
src/
 ├── adapters/verification/   # nswAdapter.js, manualAdapter.js
 ├── controllers/             # verification.controller.js
 ├── routes/                  # verification.routes.js
 ├── models/                  # GuardVerification.js, ManualVerification.js
 ├── utils/                   # crypto.js

-------------------------------------------------------------------------------------------------------------------------------------------

🗄️ Models

GuardVerification: guardId, jurisdiction, licenceNumber (encrypted), status, expiryDate, verifiedAt, source, notes.
ManualVerification: guardId, jurisdiction, status, assignee, evidence, history.

-------------------------------------------------------------------------------------------------------------------------------------------

🔌 API Endpoints

POST /api/v1/verification/start → NSW = API check, others = manual record.
GET /api/v1/verification/status/:guardId → latest snapshot.
POST /api/v1/verification/recheck/:guardId → NSW = recheck, others = set in_review.

-------------------------------------------------------------------------------------------------------------------------------------------

🔑 NSW Flow

Get OAuth token (from .env).
Verify → Details endpoints.
Save GuardVerification (verified/failed).
Errors → status = failed.

-------------------------------------------------------------------------------------------------------------------------------------------

📝 Manual Flow

Create ManualVerification (pending).
Admin checks register, uploads evidence, updates to approved/rejected.

-------------------------------------------------------------------------------------------------------------------------------------------

🔒 Security

NSW creds in .env.
Licence numbers encrypted.
Only admins can manage manual records.
All verification endpoints require authentication.
Status and recheck can be accessed by the guard themselves or an admin.
-------------------------------------------------------------------------------------------------------------------------------------------

🧪 Tests

NSW valid/expired licence.
VIC/QLD → manual record.
Status + recheck endpoints.
