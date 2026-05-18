# Phase 1 System Structure

Phase 1 of PayStream focuses on the smallest complete pipeline needed to run the product:

- Login
- Role guards
- Employee management
- Blockchain config API
- `startStream`
- `claimableAmount`
- `withdraw`
- Basic DB records

## Pipeline

### 1. Login

- Employer and employee users authenticate through the frontend login screens.
- The backend exchanges credentials or Firebase tokens for a JWT.
- The JWT is stored in the frontend and attached to future API requests.

### 2. Role Guards

- Backend route protection is handled by `SecurityService`.
- `require_dashboard_user` protects employer/admin flows.
- `get_current_user` protects employee self-service flows.

### 3. Employee Management

- Employer dashboard calls backend employee APIs.
- Employee records, wallet links, and stream flags are stored in the database.

### 4. Blockchain Config API

- Frontends request `/api/blockchain/config`.
- Backend returns contract address, ABI subset, and HeLa RPC URL.
- Frontends use that config to connect the browser wallet through ethers.

### 5. Stream Start Flow

- Employer links employee wallet.
- Employer signs `startStream(...)` on-chain.
- Frontend confirms the tx, then updates the backend employee stream state.
- Frontend also records the confirmed tx as a basic backend record.

### 6. Claimable Amount Flow

- Employee frontend reads `claimableAmount(...)` directly from the contract.
- This is a read-only blockchain view and remains on-chain as the source of truth.

### 7. Withdraw Flow

- Employee signs `withdraw()` on-chain.
- Frontend confirms the tx.
- Frontend records the confirmed withdrawal in the backend as a basic DB record.

### 8. Basic DB Records

Phase 1 keeps DB records intentionally simple:

- `User`
- `Employee`
- `Transaction`
- `Treasury`
- `BlockchainTransaction`
- `PayrollEvent`

The contract remains the source of truth for live accrual and withdrawals.
The backend records enough metadata to support auth, dashboards, and minimal operational history.
