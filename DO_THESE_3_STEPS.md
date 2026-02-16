# 3 steps only you can do (I can’t access your wallet or Web3Auth)

Everything else is already set up in the project. Do these in order:

---

## Step 1: Get Web3Auth Client ID

1. Open **https://dashboard.web3auth.io** → sign in → create a **Plug and Play** project.
2. Copy your **Client ID**.
3. Open **`frontpage/.env`** and replace the value:
   ```
   VITE_WEB3AUTH_CLIENT_ID=paste_your_client_id_here
   ```

---

## Step 2: Get wallet + HLUSD and deploy the contract

1. Install **MetaMask** → create wallet → copy your **wallet address** (`0x...`).
2. Go to **https://testnet-faucet.helachain.com** → paste your address → click **Send Me HLUSD**.
3. In MetaMask: **Account details → Show private key** → copy your **private key** (no `0x` needed).
4. Open **`deploy/.env`** and set:
   ```
   PRIVATE_KEY=paste_your_private_key_here
   TAX_VAULT_ADDRESS=0xYourWalletAddress
   ```
5. In a terminal run:
   ```
   cd deploy
   npm run deploy
   ```
6. Copy the printed **contract address** (e.g. `0xAbc123...`).

---

## Step 3: Put the contract address in the backend

1. Open **`Backend/.env`**.
2. Replace the zero address with your deployed address:
   ```
   CONTRACT_ADDRESS=0xYourDeployedAddressFromStep2
   TAX_VAULT_ADDRESS=0xYourWalletAddress
   ```
3. Restart the backend (stop and start `run.py` or your server).

---

After this, open the app → Treasury → **Connect Wallet (Web3Auth)** will work.
