# PayStream

> A blockchain-based payroll streaming platform built on the HeLa network with real-time employee fund distribution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [System Configuration](#system-configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Smart Contract](#smart-contract)
- [Product Checklist](#product-checklist)
- [Developer Notes](#developer-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

PayStream is a blockchain-enabled payroll streaming application that enables real-time salary distribution on the HeLa network. It combines smart contracts for fund streaming with a full-stack application for HR management and employee self-service.

### Core Components

- **Smart Contract**: Solidity-based payroll streaming contract with 10% tax distribution
- **HR Dashboard**: Employer/treasury management frontend (Vite + React)
- **Employee Portal**: Self-service portal for earnings and withdrawals (Vite + React)
- **Backend API**: FastAPI service handling auth, employee records, and treasury metadata

## Key Features

✅ **Real-time Payroll Streaming**
- Per-second accrual of employee earnings
- Instant pause/resume capabilities
- Transparent tax handling (10% to tax vault)

✅ **Dual Portal System**
- HR dashboard for payroll management
- Employee self-service portal
- Real-time balance tracking

✅ **Blockchain Integration**
- Native HeLa testnet & mainnet support
- Wallet integration with MetaMask/Web3
- Block explorer integration for transparency

✅ **Developer-Friendly**
- Single-command local environment setup
- Comprehensive test suite
- Blueprint-based cloud deployment

## Quick Start

### Clone and Setup (5 minutes)

```bash
git clone <repository-url>
cd BLOCKCHAIN

# One-command setup for full local environment
python dev_all.py
```

This starts:
- 🔧 Backend API at `http://127.0.0.1:8000` (FastAPI + Swagger docs at `/docs`)
- 💼 HR Dashboard at `http://localhost:5173`
- 👥 Employee Portal at `http://localhost:5174`

### Verify Installation

```bash
python check_project.py  # Verify all dependencies and configuration
```

Or on Windows:
```bash
start-dev.bat  # Double-click to launch everything
```

## System Configuration

### Demo Mode

Enable demo login credentials and test accounts for development:

**Backend** (`Backend/.env`):
```env
ENABLE_DEMO_SEED=true
```

**Frontends** (`.env` in frontpage and Frontendemployee):
```env
VITE_ENABLE_DEMO_LOGIN=true
VITE_DEMO_EMPLOYER_EMAIL=demo-employer@example.com
VITE_DEMO_EMPLOYER_PASSWORD=replace-me
VITE_DEMO_EMPLOYEE_EMAIL=demo-employee@example.com
VITE_DEMO_EMPLOYEE_PASSWORD=replace-me
```

⚠️ **Important**: Demo mode is disabled by default in production. Only enable for development environments.

### Demo Mode Behavior

| Setting | Enabled | Disabled |
|---------|---------|----------|
| Demo users auto-created | ✅ Yes | ❌ No |
| Demo login buttons visible | ✅ Yes | ❌ No |
| `/auto-login` shortcut available | ✅ Yes | ❌ No |
| Production-ready | ❌ No | ✅ Yes |

>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
## Demo Mode

Demo/test surfaces are disabled by default in production-oriented setups.

Backend:

```env
ENABLE_DEMO_SEED=false
```

Frontend:

```env
VITE_ENABLE_DEMO_LOGIN=false
VITE_DEMO_EMPLOYER_EMAIL=
VITE_DEMO_EMPLOYER_PASSWORD=
VITE_DEMO_EMPLOYEE_EMAIL=
VITE_DEMO_EMPLOYEE_PASSWORD=
```

Behavior:

- When `ENABLE_DEMO_SEED=false`, backend startup does not create demo/test users or employees.
- When `VITE_ENABLE_DEMO_LOGIN=false`, demo login buttons stay hidden.
- When `VITE_ENABLE_DEMO_LOGIN=false`, `/auto-login` is not available as a demo shortcut and redirects to the normal login flow.
- Demo credentials are only read from env vars when demo mode is explicitly enabled.

<<<<<<< Updated upstream
=======
>>>>>>> 9991c4965d9e43f227fffbbd05452d519274d7bb
>>>>>>> Stashed changes
## Current Product Scope

### ✅ Implemented Features

**Blockchain Layer**
- HeLa testnet configuration across all components
- Automatic wallet network switching (adds HeLa if missing)
- Real-time HLUSD balance tracking

**Smart Contract**
- Start/pause/cancel payroll streams
- Per-second accrual calculation
- Employee withdrawal with automatic 10% tax distribution
- Treasury deposit functionality
- Emergency admin withdrawal

**HR Dashboard**
- Treasury balance and history view
- On-chain deposit capability
- Employee list management
- Wallet linking for employees
- Stream lifecycle management (start/pause/cancel)

**Employee Portal**
- Wallet connection and management
- Claimable balance preview
- Stream status tracking
- Direct withdrawal to HeLa wallet
- Block explorer integration

### 🔄 Simplified/Future Features

- Backend event indexing (currently manual)
- Dashboard analytics (using backend records vs. live chain)
- Treasury balance reconciliation (backend separate from contract)
- Hardhat artifacts synchronization

## Architecture

```
PayStream
├── Backend/                    # FastAPI + SQLAlchemy
│   ├── main.py                # API entry point
│   ├── models.py              # Database models
│   ├── auth.py                # Authentication logic
│   ├── blockchain_routes.py   # Blockchain integration
│   └── requirements.txt        # Python dependencies
│
├── deploy/                     # Hardhat + Solidity
│   ├── contracts/CorePayroll.sol
│   ├── scripts/deploy.js
│   └── package.json
│
├── frontpage/                  # HR/Employer Dashboard
│   ├── src/pages/Employer/    # Dashboard pages
│   ├── src/blockchain/        # Web3 integration
│   └── package.json
│
└── Frontendemployee/           # Employee Portal
    ├── src/pages/             # Employee pages
    ├── src/blockchain/        # Wallet integration
    └── package.json
```

### Data Flow

```
Employee → Employee Portal → Backend API ↔ Smart Contract (HeLa)
                    ↓
          HR Dashboard ↔ Backend API ↔ Smart Contract (HeLa)
```

## HeLa Network Configuration

### Testnet

| Property | Value |
|----------|-------|
| Network Name | HeLa Testnet |
| Chain ID | `666888` (hex: `0xA2D18`) |
| RPC URL | `https://testnet-rpc.helachain.com` |
| Native Symbol | `HLUSD` |
| Explorer | `https://testnet-blockexplorer.helachain.com` |
| Status | Active (Development) |

### Mainnet

| Property | Value |
|----------|-------|
| Network Name | HeLa Official Runtime |
| Chain ID | `8668` (hex: `0x21DC`) |
| RPC URL | `https://mainnet-rpc.helachain.com` |
| Native Symbol | `HLUSD` |
| Explorer | `https://helascan.io/` |
| Status | Active (Production) |

### Switching Networks

Update these env vars in your frontend deployments:

**For Testnet:**
```env
VITE_HELA_NETWORK=testnet
VITE_HELA_CHAIN_ID=0xA2D18
VITE_HELA_RPC_URL=https://testnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Testnet
VITE_HELA_EXPLORER_BASE=https://testnet-blockexplorer.helachain.com
```

**For Mainnet:**
```env
VITE_HELA_NETWORK=mainnet
VITE_HELA_CHAIN_ID=0x21DC
VITE_HELA_RPC_URL=https://mainnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Official Runtime
VITE_HELA_EXPLORER_BASE=https://helascan.io/
```

## Smart Contract Reference

### CorePayroll.sol Overview

The smart contract manages all streaming logic and operates on HeLa network native value (HLUSD).

### Key Functions

| Function | Role | Who |
|----------|------|-----|
| `startStream(employee, ratePerSecond)` | Begin or resume payroll stream | Admin/Employer |
| `stopStream(employee)` | Pause stream, preserve accrued funds | Admin/Employer |
| `cancelStream(employee)` | Stop accrual, keep funds claimable | Admin/Employer |
| `claimableAmount(employee)` | Check earned amount | Anyone |
| `withdraw()` | Claim 90% to wallet, 10% to tax vault | Employee |
| `emergencyWithdraw()` | Admin recovery of full treasury | Admin Only |
| `setEmployer(newEmployer)` | Transfer operational control | Admin Only |

### State Management

- **Admin**: Deployer wallet by default; holds emergency authority
- **Employer**: Initially deployer; can be reassigned for operational use
- **Tax Rate**: Fixed at 10% of withdrawals (on-chain)
- **Accrual**: Per-second calculation; pausing preserves balance

### Security Features

- ✅ State updated before external transfers (prevents reentrancy)
- ✅ Zero-address and zero-rate validation on stream creation
- ✅ Cancelled stream funds remain claimable (no silent loss)
- ✅ No OpenZeppelin dependency; minimal attack surface

### Important Security Notes

⚠️ **`emergencyWithdraw()` is powerful** — only the admin wallet can use it and it drains the entire treasury.

⚠️ **Backend is not the source of truth** — the contract is the single source for on-chain balances. Backend records are UI-only.

⚠️ **Contract redeploy** — updating the contract requires new address in Backend and both frontends.

## Prerequisites

Before getting started, ensure you have:

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** — Bundled with Node.js
- **Git** — For cloning the repository
- **A HeLa-compatible wallet** — MetaMask recommended, or Web3Auth
- **(Optional) Database** — Defaults to SQLite; use PostgreSQL for production

### Development Tools (Optional)

- **Hardhat** — For contract deployment and testing
- **Postman** — For API testing (or use Swagger at `/docs`)

## Environment Setup

### 1. Frontend Configuration

Create `.env` in both `frontpage/` and `Frontendemployee/` directories (or use a shared root `.env`):

```env
# HeLa Network
VITE_HELA_NETWORK=testnet
VITE_HELA_CHAIN_ID=0xA2D18
VITE_HELA_RPC_URL=https://testnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Testnet
VITE_HELA_TICKER_NAME=HLUSD
VITE_HELA_TICKER=HLUSD
VITE_HELA_EXPLORER_BASE=https://testnet-blockexplorer.helachain.com
VITE_HELA_EXPLORER_TX=https://testnet-blockexplorer.helachain.com/tx/
VITE_HELA_EXPLORER_ADDRESS=https://testnet-blockexplorer.helachain.com/address/

# Web3 Auth
VITE_WEB3AUTH_CLIENT_ID=YOUR_WEB3AUTH_CLIENT_ID

# API
VITE_API_BASE=http://127.0.0.1:8000

# Demo Mode (optional)
VITE_ENABLE_DEMO_LOGIN=false
```

### 2. Backend Configuration

Create `Backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./paystream.db
# For production, use: postgresql://user:password@localhost/paystream

# Security
SECRET_KEY=your-super-secret-key-change-in-production

# Blockchain
HELA_RPC_URL=https://testnet-rpc.helachain.com
CONTRACT_ADDRESS=0x...  # Set after contract deployment
TAX_VAULT_ADDRESS=0x...  # Tax recipient wallet

# API
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Tax
TAX_RATE=10

# Demo Mode (optional)
ENABLE_DEMO_SEED=false
```

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
Keep `ENABLE_DEMO_SEED=false` for normal and production deployments. Only set it to `true` for an intentional demo environment.

### 3. Frontend demo login env

If you want to enable demo login buttons and `/auto-login` in a non-production demo environment, add these shared Vite vars:

```env
VITE_ENABLE_DEMO_LOGIN=true
VITE_DEMO_EMPLOYER_EMAIL=demo-employer@example.com
VITE_DEMO_EMPLOYER_PASSWORD=replace-me
VITE_DEMO_EMPLOYEE_EMAIL=demo-employee@example.com
VITE_DEMO_EMPLOYEE_PASSWORD=replace-me
```

Leave `VITE_ENABLE_DEMO_LOGIN=false` or unset it for normal and production deployments.

<<<<<<< Updated upstream
=======
>>>>>>> 9991c4965d9e43f227fffbbd05452d519274d7bb
>>>>>>> Stashed changes
## Running the Backend

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API defaults to `http://127.0.0.1:8000`.

## Running Backend And Frontends Together

For local development, you can now start the backend plus both frontend dev servers with one command:

```bash
python dev_all.py
```

To run the full verification suite from the repo root:

```bash
python check_project.py
```

Or from a shell-oriented workflow:

```bash
./scripts/check_project.sh
```

On Windows, you can also double-click:

- [`start-dev.bat`](C:/python_practice/BLOCKCHAIN/start-dev.bat)

This starts:

- backend at `http://127.0.0.1:8000`
- employer frontend at `http://localhost:5173`
- employee frontend at `http://localhost:5174`

The Vite apps already proxy `/api` requests to the backend during local development.

## Deploying the Backend on Render

This repo now includes a Render blueprint at [`render.yaml`](C:/python_practice/BLOCKCHAIN/render.yaml) for the FastAPI backend.

### What Render will create

- one Python web service: `paystream-backend`
- one Postgres database: `paystream-db`

### Before deploying

Make sure these backend values are ready:

- `SECRET_KEY`
- `HELA_RPC_URL`
- `CONTRACT_ADDRESS`
- `TAX_VAULT_ADDRESS`
- `ALLOWED_ORIGINS`

You can use [`Backend/.env.example`](C:/python_practice/BLOCKCHAIN/Backend/.env.example) as the reference.

### Deploy steps

1. Push this repo to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select this repository.
4. Render will detect [`render.yaml`](C:/python_practice/BLOCKCHAIN/render.yaml) and propose the backend service plus database.
5. Fill in the unset env vars:
   - `ALLOWED_ORIGINS`
   - `HELA_RPC_URL`
   - `CONTRACT_ADDRESS`
   - `TAX_VAULT_ADDRESS`
6. Deploy.

### Start command used by Render

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Important note about the database

Do not use SQLite on Render for production-style usage. Render web service filesystems are not the right place for persistent app data, so use the attached Postgres database through `DATABASE_URL`.

If you keep the Blueprint as-is, the database uses Render's `free` plan. That is good for testing, but free Postgres should not be treated as long-term production storage.

### After backend deploys

Copy the Render backend URL and set it in your frontend deployments:

```env
VITE_API_BASE=https://your-render-backend.onrender.com
```

That variable is used by:

- [`frontpage/src/app/api.ts`](C:/python_practice/BLOCKCHAIN/frontpage/src/app/api.ts)
- [`Frontendemployee/src/app/api.ts`](C:/python_practice/BLOCKCHAIN/Frontendemployee/src/app/api.ts)

## Running the Frontends

### Employer / HR app

```bash
cd frontpage
npm install
npm run dev
```

### Employee app

```bash
cd Frontendemployee
npm install
npm run dev
```

If PowerShell blocks `npm`, run `npm.cmd`.

## Deploying the Contract

1. Prepare the deploy env:

```bash
cd deploy
copy .env.example .env
```

2. Fill in:
=======
### 3. Smart Contract Deployment Configuration

Create `deploy/.env`:
>>>>>>> Stashed changes

```env
PRIVATE_KEY=your_wallet_private_key
TAX_VAULT_ADDRESS=0xYourTaxVault
HELA_RPC_URL=https://testnet-rpc.helachain.com
HELA_CHAIN_ID=666888
```

⚠️ **Security**: Never commit `.env` files with real private keys. Use environment-specific secrets management for production.

## Running Locally

### Single Command Setup (Recommended)

```bash
# From repository root
python dev_all.py
```

This launches all three services:
- Backend at `http://127.0.0.1:8000`
- HR Dashboard at `http://localhost:5173`
- Employee Portal at `http://localhost:5174`

**On Windows**, you can also double-click `start-dev.bat`

### Backend Only

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate  # On macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend includes **Swagger/OpenAPI docs** at `http://127.0.0.1:8000/docs`

### HR Dashboard Only

```bash
cd frontpage
npm install
npm run dev
```

Runs at `http://localhost:5173` with HMR enabled

### Employee Portal Only

```bash
cd Frontendemployee
npm install
npm run dev
```

Runs at `http://localhost:5174` with HMR enabled

### Verify Full Installation

```bash
python check_project.py
```

Or shell version:
```bash
./scripts/check_project.sh
```

This checks:
- ✅ All dependencies installed
- ✅ Environment configuration
- ✅ Network connectivity
- ✅ Database setup

## Deployment

### Smart Contract Deployment

#### Prerequisites

- HeLa testnet or mainnet RPC endpoint
- Deployer wallet with HLUSD for gas
- Tax vault wallet address

#### Deploy Steps

```bash
cd deploy

# Setup
copy .env.example .env
# Edit .env with your values

# Install and compile
npm install
npm run compile

# Deploy to HeLa Testnet
npm run deploy
```

After deployment, **copy the printed `CONTRACT_ADDRESS`** and update:
1. `Backend/.env` → `CONTRACT_ADDRESS`
2. `frontpage/.env` → Contract reference (if needed)
3. `Frontendemployee/.env` → Contract reference (if needed)

#### Multi-Signature Setup

After deployment, the deployer wallet is both `admin` and `employer`. For production:

1. Sign into the dashboard as admin
2. Call `setEmployer(operationalWalletAddress)` to separate roles

### Backend Deployment (Render)

This repo includes a [Render blueprint](render.yaml) for one-click deployment.

#### What Render Creates

- Python web service: `paystream-backend`
- PostgreSQL database: `paystream-db`

#### Deploy Steps

1. Push repository to GitHub
2. In Render dashboard: `New +` → `Blueprint`
3. Select this repository
4. Render auto-detects `render.yaml`
5. Fill in environment variables:
   - `SECRET_KEY` (generate a secure key)
   - `HELA_RPC_URL`
   - `CONTRACT_ADDRESS`
   - `TAX_VAULT_ADDRESS`
   - `ALLOWED_ORIGINS` (your frontend URLs)
6. Click Deploy

#### Start Command

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Database Notes

⚠️ **SQLite won't work on Render** — file systems are ephemeral. Use the included PostgreSQL database.

Free PostgreSQL on Render is good for testing but not production. Upgrade for long-term storage.

#### Connect Frontend to Deployed Backend

After backend deploys, copy the Render URL (e.g., `https://paystream-backend-xyz.onrender.com`) and update frontends:

```env
VITE_API_BASE=https://paystream-backend-xyz.onrender.com
```

### Frontend Deployment (Vercel)

Both `frontpage/` and `Frontendemployee/` include Vercel configuration.

#### Deploy Steps

1. Install Vercel CLI: `npm i -g vercel`
2. For each frontend:
   ```bash
   cd frontpage  # or Frontendemployee
   vercel
   ```
3. Set environment variables in Vercel dashboard
4. Set `VITE_API_BASE` to your Render backend URL

#### Environment Variables for Each Frontend

```env
VITE_HELA_NETWORK=testnet
VITE_HELA_CHAIN_ID=0xA2D18
VITE_HELA_RPC_URL=https://testnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Testnet
VITE_API_BASE=https://your-backend.onrender.com
VITE_WEB3AUTH_CLIENT_ID=YOUR_ID
```

## Wallet Integration

### Connecting to HeLa Network

When connecting a wallet (MetaMask, etc.), PayStream will automatically:

1. Check if HeLa network is available
2. Switch to HeLa if needed
3. Add HeLa network to wallet if missing

The app uses:
- `wallet_switchEthereumChain` (preferred)
- Falls back to `wallet_addEthereumChain` if switching fails

### Manual Wallet Setup

If automatic connection fails, add HeLa Testnet manually:

| Field | Value |
|-------|-------|
| Network Name | HeLa Testnet |
| RPC URL | `https://testnet-rpc.helachain.com` |
| Chain ID | `666888` |
| Symbol | `HLUSD` |
| Explorer | `https://testnet-blockexplorer.helachain.com` |

### Getting Test HLUSD

[Request testnet HLUSD from HeLa faucet](https://testnet-blockexplorer.helachain.com) (if available)

## Product Checklist

### ✅ Completed Features

| Component | Feature | Status |
|-----------|---------|--------|
| **Blockchain** | HeLa testnet support | ✅ |
| **Blockchain** | HLUSD configuration | ✅ |
| **Smart Contract** | Stream creation | ✅ |
| **Smart Contract** | Stream pause/cancel | ✅ |
| **Smart Contract** | Employee withdrawal | ✅ |
| **Smart Contract** | Tax distribution (10%) | ✅ |
| **HR Dashboard** | Treasury view | ✅ |
| **HR Dashboard** | Employee management | ✅ |
| **HR Dashboard** | Stream controls | ✅ |
| **Employee Portal** | Balance preview | ✅ |
| **Employee Portal** | Stream tracking | ✅ |
| **Employee Portal** | Withdrawal | ✅ |
| **Employee Portal** | Wallet management | ✅ |
| **Tax Module** | 10% tax split | ✅ |

### 🔄 Future/Planned

- [ ] Event indexing for backend
- [ ] Live on-chain analytics
- [ ] Treasury reconciliation
- [ ] Mainnet deployment
- [ ] Advanced reporting
- [ ] Multi-currency support

## Developer Notes

### Architecture Decisions

**Source of Truth**
- The smart contract is the single source of truth for all streaming amounts
- Backend records are metadata and UI-only
- Always verify on-chain state for critical operations

**Tax Implementation**
- Fixed at 10% on-chain (not configurable per stream)
- Backend supports tax settings UI but doesn't override contract logic
- Change tax rate by redeploying contract

**No External Dependencies**
- CorePayroll contract uses no OpenZeppelin libraries
- Minimal dependencies reduce attack surface
- Full audit trail available in contract code

### Testing

From `deploy/`:
```bash
npm test
```

Runs contract unit tests via Hardhat.

### API Documentation

Backend includes Swagger/OpenAPI UI at `/docs`:
```bash
http://127.0.0.1:8000/docs
```

## Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

```bash
cd Backend
pip install -r requirements.txt
```

**Error**: `Port 8000 already in use`

```bash
# On Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### Frontend Won't Connect to Backend

**Check**: Is backend running?
```bash
curl http://127.0.0.1:8000/docs
```

**Check**: Are origins allowed?
Verify `ALLOWED_ORIGINS` in `Backend/.env` includes your frontend URL.

**Check**: Does `.env` have correct API base?
```env
VITE_API_BASE=http://127.0.0.1:8000  # Local development
```

### Wallet Won't Connect

**Issue**: MetaMask shows wrong network

→ Manually add HeLa Testnet (see [Wallet Integration](#wallet-integration))

**Issue**: Can't get test HLUSD

→ Request from HeLa faucet or check HeLa docs for testnet funding

### Contract Address Mismatch

**Error**: `Contract not found at address`

1. Deploy contract: `cd deploy && npm run deploy`
2. Copy printed address
3. Update `Backend/.env` with `CONTRACT_ADDRESS=0x...`
4. Update frontend `.env` files
5. Restart backend

### npm Permission Denied

**On Windows/PowerShell**, if npm is blocked:

```powershell
npm.cmd run dev
```

## Resources

- **HeLa Network**: https://helachain.com
- **Smart Contract Source**: [deploy/contracts/CorePayroll.sol](deploy/contracts/CorePayroll.sol)
- **Backend API**: [Backend/main.py](Backend/main.py)
- **Project Status**: See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)

## License

MIT - See [LICENSE](LICENSE) file for details

---

**Built with ❤️ on HeLa Network**
