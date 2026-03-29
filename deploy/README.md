# Deploy PayStream to HeLa Testnet

## Network

- Network: `HeLa Testnet`
- Chain ID: `666888`
- Hex chain ID: `0xA2D18`
- RPC: `https://testnet-rpc.helachain.com`
- Symbol: `HLUSD`
- Explorer: `https://testnet-blockexplorer.helachain.com`

## 1. Prepare the wallet

Fund the deployer wallet on HeLa testnet and make sure it can pay deployment gas.

## 2. Install dependencies

```bash
cd deploy
npm install
```

## 3. Create `.env`

The repo already includes `deploy/.env.example`.

Example:

```env
PRIVATE_KEY=your_wallet_private_key
TAX_VAULT_ADDRESS=0xYourTaxVault
HELA_RPC_URL=https://testnet-rpc.helachain.com
HELA_CHAIN_ID=666888
```

## 4. Compile

```bash
npm run compile
```

## 5. Deploy

```bash
npm run deploy
```

The script prints the deployed contract address.

## 6. Update backend config

Copy the deployed address into `Backend/.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedContract
TAX_VAULT_ADDRESS=0xYourTaxVault
HELA_RPC_URL=https://testnet-rpc.helachain.com
```

## Contract behavior

The contract supports:

- `admin` and `employer` both default to the deployer at deployment time
- `startStream(employee, ratePerSecond)`
- `stopStream(employee)` for pause
- `cancelStream(employee)` for final stop
- `setEmployer(newEmployer)` by admin to assign a separate employer wallet
- `withdraw()` with a 10% tax split to `taxVault`
- `emergencyWithdraw()` for admin treasury recovery
