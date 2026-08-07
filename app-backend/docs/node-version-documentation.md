## Node.js Version Reference

_Last updated: 7 Aug 2026 - BE 011_

### Current Node versions across environments

| Environment | Node Version | Source |
|---|---|---|
| Local development | `v24.18.0` | Developer machine |
| GitHub Actions (Backend CI) | `22` | `.github/workflows/backend-lint.yml` |
| GitHub Actions (Frontend/Guard App CI) | `20` | `.github/workflows/lint.yml`, `admin-panel-lint.yml` |
| Jenkins | `NodeJS tool: Node20` | `devops/jenkins.yaml` |
| Backend Docker image | `18` | `app-backend/Dockerfile` (`FROM node:18`) |
| `package.json` `engines` field | `>=18` | `app-backend/package.json` |

### Recommendation

Standardize Backend local development, CI and Docker to **Node 22**, same version used by backend GitHub Actions lint workflow (`backend-lint.yml`). The active LTS release at the moment is Node 22 and adopting this is the closest alignment to production-facing CI checks (lint/tests) than the oldest supported floor.

### Known exception

The backend Docker image (`app-backend/Dockerfile`) is pinned to **Node 18** (not matching CI (Node 22)). This is drift rather than an intentional design choice and should be rectified in a separate ticket — Dockerfile updates are specifically out of scope for BE 011.

### Justified exceptions

- **Jenkins (Node 20):** Jenkins is a major version behind the backend CI recommendation (22) but matches the frontend/Guard App GitHub Actions workflows (20). There is no documented technical blocker for upgrading to 22, it looks like an unreviewed default rather than an intentional limitation. Here tagged for lead to verify if Jenkins has to be upgraded to 22 to align with CI or stay at 20 to align with frontend pipelines – suggest to raise as a follow up instead of fixing in BE 011.

- **`package.json` engines (`>=18`):** This is a permissive range (allows 18 and above), not a pinned version, therefore technically does not clash with any environment above. But it does not implement the suggested baseline of Node 22. This could be tightened to `>=22`, but it needs lead approval before it is implemented (per ticket scope) and is not applied in this PR.

### Notes

- This PR does not add any additional `.nvmrc` or `engines` value, as this requires lead clearance to implement per ticket limitations.
- This document should be reviewed again after the Docker Node version is aligned with CI in a follow-up ticket.
- For the comparison, evidence (workflow files, Dockerfile, package.json) was obtained straight from the `Gopher-Industries/SecureShift` repository on GitHub.
