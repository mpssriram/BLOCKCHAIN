# PayStream

PayStream is a side-project payroll streaming app built around the HeLa network and HLUSD-style value transfer.
It includes:

- a Solidity payroll streaming contract for HeLa deployment
- an HR dashboard for treasury and employee stream management
- an employee portal for wallet linking, claimable balance checks, and withdrawals
- a Python backend for auth, employee records, treasury metadata, and tax settings

## Current Product Scope

What is working in the repo now:

- HeLa testnet configuration is wired into the frontends, backend config, and Hardhat deploy config
- Wallet integration supports switching to the correct HeLa network and adding it if missing
- The payroll contract supports:
  - start stream
  - pause stream
  - cancel stream
  - per-second accrual
  - employee withdrawal
  - 10% tax split to a tax vault
  - treasury funding by sending HLUSD-style native value to the contract
- HR UI supports:
  - treasury view
  - on-chain treasury deposit
  - employee list
  - employee wallet linking
  - start / pause / cancel stream on-chain
- Employee UI supports:
  - wallet linking
  - claimable balance preview
  - stream status
  - withdrawal to connected HeLa wallet
  - explorer links for wallet and contract

What is still simplified:

- The backend does not index chain events automatically
- Some dashboard analytics still come from backend records instead of live chain indexing
- Treasury "recorded" balances in the backend are separate from the contract balance
- Hardhat artifacts in `deploy/artifacts` may be stale until you compile again locally

## Architecture

- `deploy/contracts/CorePayroll.sol`: main payroll streaming contract
- `Backend/`: FastAPI backend with auth, employee records, treasury metadata, and tax settings
- `frontpage/`: employer / HR frontend
- `Frontendemployee/`: employee frontend

## HeLa Network Configuration

### Testnet

- Network name: `HeLa Testnet`
- Chain ID: `666888`
- Hex chain ID: `0xA2D18`
- RPC URL: `https://testnet-rpc.helachain.com`
- Native symbol: `HLUSD`
- Explorer base: `https://testnet-blockexplorer.helachain.com`
- Transaction URL prefix: `https://testnet-blockexplorer.helachain.com/tx/`
- Address URL prefix: `https://testnet-blockexplorer.helachain.com/address/`

### Mainnet

- Network name: `HeLa Official Runtime`
- Chain ID: `8668`
- Hex chain ID: `0x21DC`
- RPC URL: `https://mainnet-rpc.helachain.com`
- Native symbol: `HLUSD`
- Explorer base: `https://helascan.io/`

## Contract Behavior

The Solidity contract uses simple native-value accounting:

- `admin` defaults to the deployer and keeps emergency / reassignment authority
- `employer` also defaults to the deployer until an admin reassigns it
- `startStream(employee, ratePerSecond)` starts or resumes a stream
- `stopStream(employee)` pauses a stream and preserves accrued funds
- `cancelStream(employee)` stops future accrual and clears the active rate, but keeps accrued funds claimable
- `setEmployer(newEmployer)` lets the admin assign a separate operational employer wallet
- `claimableAmount(employee)` returns the employee's total currently earned amount
- `withdraw()` sends 90% to the employee and 10% to the tax vault
- `emergencyWithdraw()` lets the admin recover the full treasury

Tax logic is intentionally simple and fixed on-chain at 10%.

## Security Notes

- No OpenZeppelin inheritance is used in the payroll contract
- The contract keeps the deployer as both `admin` and `employer` by default, then splits admin-only and employer-capable actions only where needed
- State is updated before external transfers inside `withdraw()`
- `startStream()` now rejects zero address employees and zero rates
- `cancelStream()` keeps already-earned funds claimable instead of silently discarding them

Risk to understand:

- `emergencyWithdraw()` is powerful and intentionally drains the contract treasury to the admin wallet
- The backend is not the source of truth for on-chain balances
- If you redeploy the contract, update the backend and both frontends with the new contract address

## Prerequisites

- Node.js 18+ with npm
- Python 3.11+
- A database for the backend
- A HeLa-compatible wallet or Web3Auth client ID

## Environment Setup

### 1. Frontend environment

This repo currently keeps shared frontend vars in the root file:

- [`# ===== Frontpage (Vite) =====.env`](C:/python_practice/BLOCKCHAIN/#%20=====%20Frontpage%20(Vite)%20=====.env)

Key values:

```env
VITE_HELA_NETWORK=testnet
VITE_HELA_CHAIN_ID=0xA2D18
VITE_HELA_RPC_URL=https://testnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Testnet
VITE_HELA_TICKER_NAME=HLUSD
VITE_HELA_TICKER=HLUSD
VITE_HELA_EXPLORER_BASE=https://testnet-blockexplorer.helachain.com
VITE_HELA_EXPLORER_TX=https://testnet-blockexplorer.helachain.com/tx/
VITE_HELA_EXPLORER_ADDRESS=https://testnet-blockexplorer.helachain.com/address/
VITE_WEB3AUTH_CLIENT_ID=YOUR_WEB3AUTH_CLIENT_ID
VITE_API_BASE=http://127.0.0.1:8000
```

To target mainnet later, switch:

```env
VITE_HELA_NETWORK=mainnet
VITE_HELA_CHAIN_ID=0x21DC
VITE_HELA_RPC_URL=https://mainnet-rpc.helachain.com
VITE_HELA_DISPLAY=HeLa Official Runtime
VITE_HELA_EXPLORER_BASE=https://helascan.io/
```

### 2. Backend environment

Create `Backend/.env` with at least:

```env
DATABASE_URL=sqlite:///./paystream.db
SECRET_KEY=replace-this-in-real-deployments
HELA_RPC_URL=https://testnet-rpc.helachain.com
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT
TAX_VAULT_ADDRESS=0xYOUR_TAX_VAULT
TAX_RATE=10
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ENABLE_DEMO_SEED=false
```

## Running the Backend

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API defaults to `http://127.0.0.1:8000`.

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

```env
PRIVATE_KEY=your_wallet_private_key
TAX_VAULT_ADDRESS=0xYourTaxVault
HELA_RPC_URL=https://testnet-rpc.helachain.com
HELA_CHAIN_ID=666888
```

3. Install and compile:

```bash
npm install
npm run compile
```

4. Deploy:

```bash
npm run deploy
```

5. Copy the printed `CONTRACT_ADDRESS` into `Backend/.env`.

After deployment, the deployer wallet is both `admin` and `employer`. If you want a separate operational employer wallet, sign in as admin in the dashboard settings and call `setEmployer(...)` once.

## Connecting Wallet to HeLa Testnet

If your wallet does not already know the network, the app will try:

1. `wallet_switchEthereumChain`
2. fallback to `wallet_addEthereumChain`

The wallet metadata includes the correct HeLa explorer URL.

Manual testnet details:

- Network: `HeLa Testnet`
- Chain ID: `666888`
- RPC: `https://testnet-rpc.helachain.com`
- Symbol: `HLUSD`
- Explorer: `https://testnet-blockexplorer.helachain.com`

## Product Checklist

### Blockchain layer

- HeLa testnet deployment support: yes
- HLUSD-aligned amount labels and network config: yes
- smart-contract-based payroll streaming logic: yes

### HR dashboard

- start stream: yes
- pause stream: yes
- cancel stream: yes
- treasury view: yes
- employee payroll management: yes

### Employee portal

- view accrued earnings: yes
- track stream status: yes
- withdraw accrued funds: yes
- wallet + explorer access: yes

### Tax module

- 10% tax split to tax vault on withdrawal: yes
- backend tax settings UI: present, but on-chain tax is still fixed at 10%

## Developer Notes

- The source of truth for streaming accrual is the Solidity contract
- The backend mostly supports auth, employee metadata, and admin operations around the UI
- If you want full historical on-chain reporting, add event indexing or a subgraph-style data service

## License

MIT
