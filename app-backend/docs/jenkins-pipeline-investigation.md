# Jenkins Pipeline Investigation

## 1. Jenkins Configuration

Jenkins configuration is located at `devops/jenkins.yaml`. Git history confirms that the file was added as a Jenkins pipeline on 21 May 2026. No `Jenkinsfile` is present in the repository.

## 2. Pipeline Stages

The Jenkins pipeline contains the following stages:

1. Checkout
2. Setup `.env`
3. Install Dependencies
4. Run Jest Tests
5. Docker Build Backend

After the test stages, the pipeline generates and archives an HTML test report. The pipeline also provides handling for successful, unstable, and failed builds.

## 3. Node Version and Install Commands

**Node version:** Jenkins uses the NodeJS tool `Node20`.

**Install commands:**

```bash
npm install
npm install --save-dev jest-junit
```

These commands run in the `app-backend` directory.

## 4. Test Failure Handling

The Jest test command is wrapped in
`catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE')`
If the Jest tests fail, the test stage is marked **UNSTABLE** while the overall build remains **SUCCESS**, allowing the pipeline to continue to the Docker build stage.

Test results are generated, and an HTML test report is created and archived as a Jenkins build artifact.

## 5. Required Credentials and Environment Variables

The pipeline requires the following Jenkins-managed credentials, which are exposed as environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `PORT`

These are retrieved using Jenkins `withCredentials` and written to `app-backend/.env`. 

## 6. Docker Build and Deployment

The pipeline builds the backend Docker image using:

```bash
docker build -t secureshift-backend .
```

No `docker push` command or Docker registry configuration was identified.
No deployment commands were identified in `devops/jenkins.yaml`.
Therefore, the Jenkins pipeline builds the Docker image but does not appear to publish or deploy it.

## 7. Known Infrastructure Requirements and Missing Information

Known requirements:
- An available Jenkins agent (`agent any`) - runs the pipeline.
- Jenkins NodeJS tool `Node20` - runs the Node.js commands.
- Docker access - builds the backend Docker image.
- Access to the SecureShift GitHub repository - checks out the `main` branch.
- Required Jenkins credentials - provides the backend configuration values.
- GitHub push trigger configuration - triggers the pipeline on GitHub push events.

The repository does not identify:
- Jenkins server owner - Who maintains the Jenkins server.
- Jenkins server hosting environment - Where the Jenkins server is running.
- Specific Jenkins agent - `agent any` is used, so the pipeline doesn't identify which machine/agent runs it.
- Jenkins server status - Whether Jenkins is currently active.
- External deployment infrastructure - The repository does not identify whether another system uses the Docker image for deployment.

## 8. Recommendation

Recommendation: Retain.

The repository also contains GitHub Actions workflows, but the Jenkins pipeline provides backend testing, test reporting, and Docker image building. The responsibilities of Jenkins and GitHub Actions should be confirmed to avoid unneccessary duplication.

## 9. Recommended Next Action

Confirm with the project team whether the Jenkins pipeline is currently in use and who maintains it. If it is still in use, document its purpose and relationship with GitHub Actions. If it is not in use, create a separate task to assess whether it should be retired or replaced.

No Jenkins configuration was changed or removed as part of this investigation.