# CI/CD & Keyless Deployment Architecture

This repository uses **Google Cloud Workload Identity Federation (WIF)** to deploy to Firebase Hosting automatically on every push or merge to the `develop` branch.

---

## 🔒 Security Architecture (Zero JSON Keys)

```
+------------------------------------+
|        GitHub Actions Runner       |
|    token.actions.githubusercontent |
+-----------------+------------------+
                  |
                  | (1) Requests OIDC Token
                  v
+------------------------------------+
|    Google Cloud STS Token Exchange |
|    (projects/PROJECT_NUMBER/...)   |
+-----------------+------------------+
                  |
                  | (2) Validates Repo Match:
                  |     attribute.repository == "YOUR_ORG/YOUR_REPO"
                  v
+------------------------------------+
|      Impersonates Service Account  |
|      deployer-sa@PROJECT_ID...     |
+-----------------+------------------+
                  |
                  | (3) Temporary OAuth Token Issued
                  v
+------------------------------------+
|          Firebase Hosting          |
|      https://PROJECT_ID.web.app    |
+-----------------+------------------+
```

### Key Highlights:

- **No Static Credentials**: No private JSON keys are stored in GitHub Repository Secrets.
- **Least Privilege**: The GitHub runner is only allowed to deploy to Firebase Hosting within the authorized repository.
- **Short-Lived Tokens**: Access tokens expire automatically after the deployment job completes.

---

## 🔑 Required GitHub Secrets

Configured under **Settings ➔ Secrets and variables ➔ Actions ➔ Repository secrets**:

| Secret Name                      | Purpose                                                 | Example Value                                                                                                        |
| :------------------------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                 | Target Google Cloud Project                             | `your-gcp-project-id`                                                                                                |
| `WORKLOAD_IDENTITY_PROVIDER`     | Full resource path of WIF OIDC Provider                 | `projects/123456789012/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `FIREBASE_SERVICE_ACCOUNT_EMAIL` | Service Account with Firebase Hosting Admin permissions | `gh-action-fe-deployer@your-gcp-project-id.iam.gserviceaccount.com`                                                  |

---

## 🚀 Deployment Pipeline (`deploy-to-dev-stg-on-develop-merge.yml`)

The pipeline runs on `ubuntu-latest`:

1. **Checkout**: Checks out source code.
2. **Setup Node**: Installs Node 26 with npm caching.
3. **Build**: Compiles production bundle (`npm run build-prod`).
4. **Authenticate (Keyless)**: Exchanges GitHub OIDC token for Google ADC via `google-github-actions/auth@v2`.
5. **Deploy**: Deploys `dist/browser` directly using `npx firebase-tools@15.34.0 deploy --only hosting`.

---

## 🛠️ Infrastructure Management

The underlying Google Cloud Workload Identity Federation pool, providers, service accounts, and GitHub Secrets can be managed as Infrastructure as Code (IaC) in a central orchestrator repository.
