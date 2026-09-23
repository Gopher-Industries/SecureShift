# SecureShift

## Full-stack local quickstart (canonical)

SecureShift is one monorepo: `app-backend/` (Express API),
`app-frontend/employer-panel/`, `app-frontend/admin-panel/` (React), and
`guard_app/` (Expo mobile app, started separately).

Use Docker Desktop on macOS or Windows with WSL2 integration, or Docker Engine
with the Compose plugin on Linux. Run the commands below from the repository root
(in your integrated WSL distro on Windows).

### First-time setup

Compose supplies local development credentials and Mailpit email settings. No
private credentials or backend `.env` file are needed for ordinary local Compose
setup. These public development values must not be used in production.

Most users need no configuration. If a host port is occupied, copy `.env.example`
to `.env` and uncomment only the relevant override. For example,
`BACKEND_HOST_PORT=5001` avoids an occupied port 5000 (sometimes AirPlay on macOS).
Keep private `.env` files out of Git.

```bash
docker compose up --build -d
docker compose ps -a
docker compose logs ollama-models ai-indexer
```

The first model download and indexing can take time. Check all eight services:

| Service | Purpose | Default host access / expected state |
| --- | --- | --- |
| `backend` | API and Swagger | http://localhost:5000/api/v1/health and http://localhost:5000/api-docs |
| `mongodb` | Local database | localhost:27017; healthy |
| `mailpit` | Local email capture | SMTP localhost:1025; inbox http://localhost:8025; healthy |
| `frontend-employer` | Employer panel | http://localhost:3000 |
| `frontend-admin` | Admin panel | http://localhost:3001/login |
| `ollama` | Local AI server | Compose network only, port 11434; no host port published |
| `ollama-models` | Downloads and verifies both models | One-shot job; `Exited (0)` means success |
| `ai-indexer` | Builds knowledge-base vectors | One-shot job; `Exited (0)` means success |

Ollama needs `nomic-embed-text:latest` for embeddings and `llama3.2:latest` for
answers. Inspect failures in the job logs before proceeding. The backend waits
for MongoDB and Mailpit healthchecks, **not** for model downloads or indexing.
Backend HTTP 200 does not guarantee AI/index readiness.

After successful indexing, ensure the backend loads the regenerated vectors:

- If already running: `docker compose restart backend`
- If not currently running: `docker compose up -d backend`

```bash
curl http://localhost:5000/api/v1/health
```

Substitute your overridden host port in URLs (for example, 5001). Compose supplies
that backend port to both web panels. Check the Employer Panel AI assistant after
indexing and backend startup; HTTP health alone is not an AI smoke test.

### Local accounts and OTP

To create or update deterministic local fixtures, run:

```bash
docker compose run --rm -e SEED_ALLOW_LOCAL=true backend npm run seed
```

See [backend seed accounts](app-backend/README.md#local-development-seed-data).
Employer and guard login still require OTP: open http://localhost:8025 and read
the captured message. Mailpit does not deliver external email and needs no SMTP
credentials. Admin login uses the admin account and its dedicated endpoint.

### Normal daily restart and shutdown

```bash
docker compose up -d
docker compose ps -a
```

Check the one-shot job logs if they run again. After successful indexing, use
the restart/start commands below to load the regenerated vectors. Use `docker compose up --build -d` after changes requiring an image rebuild.

For a simple backend process restart, use `docker compose restart backend`.
For normal shutdown, preserving MongoDB data, downloaded models, and uploads:

```bash
docker compose down
```

### Knowledge-base updates

The indexer reads all TXT files in `app-backend/knowledge-base/docs/`. Current sources:

- `backend_onboarding_v1.1.txt`
- `onboarding.txt`
- `guard_app_onboarding.txt`

It writes one corresponding JSON file per source under
`app-backend/knowledge-base/vectors/`. After source changes, run from the root:

```bash
docker compose run --rm ai-indexer
```

After successful indexing, ensure the backend loads the regenerated vectors:

- If already running: `docker compose restart backend`
- If not currently running: `docker compose up -d backend`

Vectors are loaded by the backend at startup; it does not automatically reload
newly generated vectors or wait for indexing. Review generated changes separately.
For this documentation handover, vector regeneration is deferred until review.

### Destructive resets (not routine cleanup)

`npm run seed:reset` deletes only known seed records and does not repopulate them;
see the separate reset instructions in the backend README.

**Warning: `docker compose down -v` deletes MongoDB data, downloaded Ollama models,
and uploads. It is not routine cleanup.** Back up anything needed before choosing
this full reset; then repeat first-time setup and seeding as needed.

Historical migration note: older Compose volumes may retain previous database
users because MongoDB initialization does not rerun on existing volumes. Diagnose
authentication failures first; new contributors do not need a volume reset.

## Component development

- [Environment and host backend setup](ENVIRONMENT_SETUP.md)
- [Backend API, tests, and seed data](app-backend/README.md)
- [Employer panel](app-frontend/employer-panel/README.md)
- [Admin panel](app-frontend/admin-panel/README.md)
- [Guard App](guard_app/README.md)

Host backend development requires Node >=22.13.0 and `npm ci`. Runtime validation
was recorded at Node v22.13.1. The stable backend CI command is `npm run test:ci`;
the handover snapshot is 5 suites, 91/91 tests passing (not a new run of this patch).
