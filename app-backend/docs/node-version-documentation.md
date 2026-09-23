# Node.js version reference

## Current handover baseline

| Environment | Version / configuration | Source |
| --- | --- | --- |
| Backend host minimum | >=22.13.0 | `app-backend/package.json` engines |
| Backend runtime validation | v22.13.1 | Runtime-hardening handover snapshot |
| Backend Docker image | `node:22.13` | `app-backend/Dockerfile` |
| Backend GitHub Actions | 22 | `.github/workflows/backend-lint.yml` |
| Frontend / Guard App GitHub Actions | 20 | `lint.yml`, `admin-panel-lint.yml`, `guard-app-ci.yml` |
| Jenkins | `Node20` tool | `devops/jenkins.yaml` |

Use `npm ci` for backend host installation. Run `npm run test:ci` for the stable
backend CI allowlist: 5 suites, with 91/91 passing tests in the handover snapshot.
This records prior validation, not a new test run or a promise about the full
legacy test suite. See [backend testing](../README.md#-testing).

## Historical note

The 7 Aug 2026 BE 011 report described a backend Node 18 image and `>=18` engine
floor. Those findings were superseded by the merged runtime-hardening work.
Frontend/Guard App CI and Jenkins versions above remain separate configurations;
this documentation cleanup does not change them or runtime architecture.
