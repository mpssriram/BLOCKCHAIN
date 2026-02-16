# How to Get Your Contract Address

To use the **On-Chain Treasury** and **Connect Wallet** in the app, you need to deploy the CorePayroll contract and put its address in the backend.

---

## 1. Get testnet HLUSD (for gas)

1. Open **https://testnet-faucet.helachain.com**
2. Connect a wallet (e.g. MetaMask).
3. Add **HeLa Testnet** if needed:
   - **Network name:** HeLa Testnet  
   - **RPC URL:** `https://testnet-rpc.helachain.com`  
   - **Chain ID:** `666888`
4. Claim free HLUSD (once per 24h).

---

## 2. Get your wallet private key

- In MetaMask: **Account menu → Account details → Show private key** (or export).  
- You will use this in the next step. **Never share it or commit it to git.**

---

## 3. Configure the deploy folder

```bash
cd deploy
npm install
```

Edit **`deploy/.env`** (create it from `.env.example` if needed):

```env
# Your wallet private key (the one that has HLUSD from the faucet)
PRIVATE_KEY=your_private_key_without_0x

# Address that receives the 10% tax. For testing, use your own wallet address.
TAX_VAULT_ADDRESS=0xYourWalletAddress
```

Use the **same** wallet address for `TAX_VAULT_ADDRESS` as the one whose private key you used (so tax goes to you when testing).

---

## 4. Deploy and copy the contract address

```bash
cd deploy
npm run deploy
```

When it succeeds, you’ll see something like:

```
✅ CorePayroll deployed to: 0x1234567890abcdef...
Add to Backend/.env:
CONTRACT_ADDRESS=0x1234567890abcdef...
TAX_VAULT_ADDRESS=0xYourWalletAddress
```

Copy that **CONTRACT_ADDRESS** value.

---

## 5. Put the address in the backend

Edit **`Backend/.env`** and set:

```env
CONTRACT_ADDRESS=0x1234567890abcdef...
TAX_VAULT_ADDRESS=0xYourWalletAddress
```

(Use the real address from the deploy output.)

Restart the backend. The app will then use this contract and the **Connect Wallet (Web3Auth)** button will work with the on-chain treasury.
