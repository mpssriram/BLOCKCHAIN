import { ethers } from "ethers";
import { HELA_CHAIN_CONFIG, CORE_PAYROLL_ABI } from "./config";

let payrollContract: ethers.Contract | null = null;
let signer: ethers.Signer | null = null;

function getInjectedWallet() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error("No browser wallet found. Install MetaMask or another EIP-1193 wallet.");
  }
  return ethereum;
}

export async function loginAndConnectContract(contractAddress: string): Promise<{
  address: string;
  contract: ethers.Contract;
  signer: ethers.Signer;
}> {
  const injected = getInjectedWallet();
  const provider = new ethers.BrowserProvider(injected);
  await injected.request?.({ method: "eth_requestAccounts" });
  await ensureHeLaNetwork(injected);
  const s = await provider.getSigner();

  payrollContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, s);
  signer = s;

  const address = await s.getAddress();
  return { address, contract: payrollContract, signer: s };
}

export async function logoutWallet(): Promise<void> {
  payrollContract = null;
  signer = null;
}

export function isConnected(): boolean {
  return !!signer && !!payrollContract;
}

export function getPayrollContract(): ethers.Contract | null {
  return payrollContract;
}

export function getSigner(): ethers.Signer | null {
  return signer;
}

export async function getConnectedAddress(): Promise<string | null> {
  if (!signer) return null;
  try {
    return await signer.getAddress();
  } catch {
    return null;
  }
}

function isChainMissingError(error: any) {
  return error?.code === 4902 || /4902|unknown chain|unrecognized chain/i.test(String(error?.message || ""));
}

export async function ensureHeLaNetwork(ethereum: any) {
  try {
    const chainId = await ethereum.request?.({ method: "eth_chainId" });
    if (chainId?.toLowerCase() === HELA_CHAIN_CONFIG.chainId.toLowerCase()) return;

    try {
      await ethereum.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HELA_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (!isChainMissingError(switchError)) throw switchError;

      await ethereum.request?.({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: HELA_CHAIN_CONFIG.chainId,
          chainName: HELA_CHAIN_CONFIG.displayName,
          rpcUrls: [HELA_CHAIN_CONFIG.rpcTarget],
          blockExplorerUrls: [HELA_CHAIN_CONFIG.blockExplorerUrl],
          nativeCurrency: {
            name: HELA_CHAIN_CONFIG.tickerName,
            symbol: HELA_CHAIN_CONFIG.ticker,
            decimals: 18,
          },
        }],
      });
    }
  } catch {
    // Wallet network switching is helpful but not required for read-only UI.
  }
}
