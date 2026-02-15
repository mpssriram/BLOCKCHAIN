# Web2 ↔ Web3 blueprint (how it fits this project)

This doc maps the “magic link” + embedded wallet blueprint to your codebase.

---

## Core idea (from the blueprint)

- **Web2:** User is identified by **Employee ID / Password** (or email).
- **Web3:** The chain and contract only know **Wallet Address** (`msg.sender`).
- **Glue:** The **database** links the two: each user has a **wallet_address** on their profile.

Rule: *They must connect the wallet that is saved to their profile* (employer links it, or we verify on connect).

---

## What this project already has

| Blueprint piece | Where it lives |
|-----------------|----------------|
| **DB: wallet_address per user** | `Backend/models.py`: `Employee.wallet_address` |
| **Employer links employee wallet** | `frontpage` → Employee details → “Wallet: 0x…” + API `PUT /api/employees/{id}/wallet` |
| **Ethers.js in the app** | Both frontends use `ethers` (v6) + Web3Auth provider (no MetaMask) |
| **Connect Wallet** | Employer: `Treasury.tsx`. Employee: `Frontendemployee/src/app/App.tsx` → `handleConnectWallet()` |
| **Verify wallet matches DB** | Employee app: after Web3Auth connect, we compare `connected address` to `profile.employee.wallet_address`; if HR linked a wallet and it doesn’t match, we show an error and don’t use that wallet |
| **Fund treasury (employer)** | `Treasury.tsx` → “Deposit to Contract” → `signer.sendTransaction({ to: contractAddress, value })` |
| **Check claimable (employee)** | `App.tsx` → `contract.claimableAmount(address)` |
| **Withdraw (employee)** | `App.tsx` → `contract.withdraw()` |
| **Embedded wallet (no MetaMask)** | Web3Auth in `frontpage/src/blockchain/web3Auth.ts` and `Frontendemployee/src/blockchain/web3Auth.ts` – same flow: login (Email/Google) → MPC wallet → ethers signer → contract calls |
| **.sol unchanged** | `CorePayroll.sol` / `blockchain.sol` – no changes for Web2 vs Web3; chain only sees a valid signer |

---

## User flow (aligned with the blueprint)

1. **Employer** logs in (Web2) → Treasury → Connect Wallet (Web3Auth) → Deposit HLUSD to contract.
2. **Employer** → Employees → [Employee] → **Link Wallet** (saves employee’s wallet to DB).
3. **Employee** logs in (Web2) → Connect Wallet (Web3Auth).  
   - If HR already linked a wallet: **only that wallet** is accepted (verification in `handleConnectWallet`).  
   - If none linked yet: any connected wallet is allowed (HR can link it later).
4. Employee sees Claimable → clicks Withdraw → Web3Auth signs `withdraw()` in the background.

No MetaMask, no seed phrases; the “magic link” is **login ↔ wallet_address in DB**, with Web3Auth as the embedded signer.
