# PayStream

PayStream is a payroll streaming prototype for the HeLa network. It has three active parts:

- `Backend/`: FastAPI API, authentication, payroll records, and blockchain metadata.
- `frontpage/`: landing page, employer login, password reset, and employer dashboard.
- `Frontendemployee/`: employee earnings, wallet, and withdrawal portal.

The legacy Streamlit application has been removed. React is the only supported UI.

## Local development

Requirements: Python 3.11+, Node.js 18+, npm, and an optional HeLa-compatible wallet.

Run all services from the repository root:

```powershell
python dev_all.py
```

The launcher creates a local SQLite configuration when needed and starts:

- API: `http://127.0.0.1:8000`
- Employer app: `http://127.0.0.1:5173`
- Employee portal: `http://127.0.0.1:5174/employee/`

The ports are fixed. If one is already in use, the launcher stops instead of silently moving an app to a different port.

Local demo accounts are seeded only by the generated development configuration:

- Employer: `employer@test.com` / `123456`
- Employee: `employee@test.com` / `123456`

Do not use these credentials outside local development.

## Configuration

For local development, run one setup file from the repository root:

```powershell
python configure_local.py
```

It creates `Backend/.env` for FastAPI and one shared root `.env` for both React frontends. Existing files are protected; use `--overwrite` only when you intentionally want to replace them.

For manual or production configuration, use `Backend/.env.example` as the backend reference.

```env
APP_ENV=development
DATABASE_URL=sqlite:///./blockchain.db
SECRET_KEY=replace-with-a-random-value-at-least-32-characters-long
ALLOWED_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:5174
ENABLE_DEMO_SEED=false
```

For production:

- Set `APP_ENV=production`.
- Set a unique `SECRET_KEY` of at least 32 characters. The API refuses to start with the default value.
- Use PostgreSQL rather than SQLite.
- Configure `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` for password-reset and approval emails.
- Set `ALLOWED_ORIGINS` to the exact deployed frontend URLs.
- Configure `VITE_API_BASE` in both frontend deployments.

Firebase Google sign-in is optional. The Google button appears only when the `VITE_FIREBASE_*` browser configuration is supplied and the backend has a matching Firebase service account.

For a new production database, create the first administrator from a trusted shell after setting production environment variables:

```powershell
cd Backend
python bootstrap_admin.py admin@company.com
```

The command refuses to run once an administrator already exists.

## Account access

- Administrators create employer and employee accounts through the protected API.
- An unknown employee attempting password sign-in creates an access request. An employer or administrator approves it from the Employees dashboard.
- Approval creates both the login account and employee profile, then sends an email confirmation.
- Password reset uses an email OTP. Resetting a password invalidates existing sessions.
- Employee deactivation prevents new and existing employee sessions from using the API.

The employee portal uses a short-lived, one-time portal handoff code. No bearer token is placed in a browser URL.

## Validation

Run the project checks from the repository root:

```powershell
python check_project.py
```

This compiles the backend and creates production builds for both React applications.

The smart-contract test suite is separate:

```powershell
cd deploy
npm test
```

## Deployment notes

The Solidity contract is under `deploy/contracts/CorePayroll.sol`. The contract is the source of truth for on-chain balances and payments; the backend stores operational metadata and UI records.

Set these production variables before deploying the backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `ALLOWED_ORIGINS`
- `HELA_RPC_URL`
- `CONTRACT_ADDRESS`
- `TAX_VAULT_ADDRESS`
- SMTP variables if email workflows are enabled

Do not expose wallet private keys, SMTP credentials, service accounts, or local `.env` files in Git.
