# SecureShift Employer Panel

React web client in the SecureShift monorepo. Follow the
[root full-stack quickstart](../../README.md) for Compose setup, local accounts,
Mailpit OTP, and AI indexing. Default URL: http://localhost:3000; the Admin Panel
is separate on port 3001.

## Host development

Start the backend first. From the repository root:

```bash
cd app-frontend/employer-panel
npm ci
npm start
```

Use Node 22.13+ for a shared local toolchain. On first setup, create a local `.env`
if needed with your backend URL:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

Use port 5001 if the backend is configured that way. Restart the frontend after
environment changes. Compose supplies this value automatically; it needs no
private credentials. Read local login OTP messages at http://localhost:8025.

For daily host startup, run `npm start` here. Available checks include `npm test`
(interactive React test runner) and `npm run build` (production build).

The AI assistant requires both Ollama models and a completed index; backend HTTP
200 alone is insufficient. Compose Ollama is not published to the host. Follow
the root README for AI readiness.

After successful indexing, ensure the backend loads the regenerated vectors:

- If already running: `docker compose restart backend`
- If not currently running: `docker compose up -d backend`
