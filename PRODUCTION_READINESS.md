# Production Readiness

This note is intentionally short and focused on operational safety.

## Required Environment Variables

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `HELA_RPC_URL`
- `CONTRACT_ADDRESS`
- `TAX_VAULT_ADDRESS`
- `TAX_RATE`
- `ALLOWED_ORIGINS`
- `ENABLE_DEMO_SEED=false`
- one of:
  - `FIREBASE_SERVICE_ACCOUNT_PATH`
  - `FIREBASE_SERVICE_ACCOUNT_JSON`

Employer frontend:

- `VITE_WEB3AUTH_CLIENT_ID`
- `VITE_API_BASE` for deployed environments
- `VITE_EMPLOYEE_PORTAL_URL`
- `VITE_HELA_RPC_URL`
- `VITE_HELA_CHAIN_ID`
- `VITE_HELA_EXPLORER_ADDRESS`
- `VITE_HELA_EXPLORER_TX`
- `VITE_ENABLE_DEMO_LOGIN=false`

Employee frontend:

- `VITE_WEB3AUTH_CLIENT_ID`
- `VITE_API_BASE` for deployed environments
- `VITE_EMPLOYEE_LOGIN_URL`
- `VITE_HELA_RPC_URL`
- `VITE_HELA_CHAIN_ID`
- `VITE_HELA_EXPLORER_ADDRESS`
- `VITE_HELA_EXPLORER_TX`
- `VITE_ENABLE_DEMO_LOGIN=false`

Deploy tooling:

- `PRIVATE_KEY`
- `TAX_VAULT_ADDRESS`
- `HELA_RPC_URL`
- `HELA_CHAIN_ID`

## Demo Mode Behavior

- `ENABLE_DEMO_SEED=false` keeps backend startup from creating demo/test users and employees.
- `VITE_ENABLE_DEMO_LOGIN=false` hides demo login helpers in the employer and employee frontends.
- `/auto-login` is only useful when demo login is explicitly enabled and demo credentials are configured.
- Demo credentials should never be relied on in normal or production deployments.

## Known Medium-Risk Areas

- Treasury state: backend recorded treasury fields and live chain balance are not the same source of truth.
- Reporting and analytics: several dashboard/reporting views depend on backend records rather than full chain indexing.
- Startup migration helpers in `Backend/main.py`: they are convenient, but should be treated carefully in production operations.
- Event sync paths: chain event ingestion exists, but it is not a substitute for a full indexing pipeline.

## Remaining Blockers

- End-to-end verification of real blockchain settlement is still missing; current backend tests do not confirm successful live chain transactions.
- Reporting correctness is still tied to backend-recorded rows and should be manually checked against expected payroll scenarios before production rollout.
- Treasury sync is intentionally non-operational until a real chain balance reader is implemented and verified.
- Role-boundary smoke coverage now exists, but broader auth regression coverage is still limited.

## Routes And Services Not To Delete Casually

Routes:

- Auth routes in `Backend/auth.py`
- Treasury routes in `Backend/api_routes.py`
- Reporting routes in `Backend/api_routes.py`
- Notification routes in `Backend/api_routes.py`
- Employee self-service routes under `/me/*`
- Blockchain config route in `Backend/blockchain_routes.py`

Services / modules:

- `Backend/service.py`
- `Backend/stream_chain.py`
- `Backend/export.py`
- `Backend/security.py`

These areas connect frontend flows, recorded backend state, or on-chain reads. They may look lightly coupled in places, but they affect live auth, payroll visibility, and operational tooling.

## Chain State vs Backend State

- The Solidity contract is the source of truth for stream accrual and on-chain withdrawal effects.
- The backend stores application metadata, auth/session context, tax settings, logs, and recorded transaction history.
- A backend balance field or status record should not be assumed to equal current live contract state unless explicitly synced from chain.
- Production troubleshooting should check both sources before treating a discrepancy as a bug.
