/**
 * Web3Auth + Ethers.js bridge for Employee portal.
 *
 * BUGS FIXED:
 *  1. Used `init()` (Wallet Services SDK) instead of `initModal()` (Modal SDK)
 *  2. Missing `chainConfig` in Web3Auth constructor - network was never set
 *  3. Added `reconnect()` to restore an existing session without showing the modal
 */

import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";
import { HELA_CHAIN_CONFIG, CORE_PAYROLL_ABI } from "./config";

const WEB3AUTH_CLIENT_ID = (import.meta as any).env?.VITE_WEB3AUTH_CLIENT_ID || "YOUR_WEB3AUTH_CLIENT_ID";

let web3auth: Web3Auth | null = null;
let payrollContract: ethers.Contract | null = null;
let signer: ethers.Signer | null = null;

/**
 * Initialize Web3Auth modal (call once on app load or before first connect).
 */
export async function initWeb3Auth(): Promise<Web3Auth> {
  if (web3auth) return web3auth;

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig: HELA_CHAIN_CONFIG }
  });

  // BUG FIX 1+2: Use `initModal()` (not `init()`), and pass `privateKeyProvider`
  web3auth = new Web3Auth({
    clientId: WEB3AUTH_CLIENT_ID,
    web3AuthNetwork: "sapphire_devnet",       // use "sapphire_mainnet" for production
    privateKeyProvider,
  });

  await web3auth.initModal();                 // BUG FIX 1: was `(web3auth as any).init()`
  return web3auth;
}

/**
 * BUG FIX 3: Restore an existing Web3Auth session silently (no modal popup).
 * Call this on app startup. Returns the wallet address if already connected, or null.
 */
export async function reconnectIfLoggedIn(contractAddress: string): Promise<string | null> {
  try {
    const auth = await initWeb3Auth();
    // Web3Auth caches the session; if the provider is available the user is still logged in
    if (!auth.provider) return null;

    const provider = new ethers.BrowserProvider(auth.provider);
    const s = await provider.getSigner();
    payrollContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, s);
    signer = s;
    return await s.getAddress();
  } catch {
    return null;
  }
}

/**
 * Connect wallet via Web3Auth and connect to CorePayroll contract.
 * Call this when user clicks "Connect Wallet".
 */
export async function loginAndConnectContract(contractAddress: string): Promise<{
  address: string;
  contract: ethers.Contract;
  signer: ethers.Signer;
}> {
  let s: ethers.Signer | null = null;

  if (WEB3AUTH_CLIENT_ID && WEB3AUTH_CLIENT_ID !== "YOUR_WEB3AUTH_CLIENT_ID") {
    const auth = await initWeb3Auth();
    const web3authProvider = await auth.connect();
    if (!web3authProvider) throw new Error("Failed to connect Web3Auth");
    const provider = new ethers.BrowserProvider(web3authProvider);
    s = await provider.getSigner();
  } else if (typeof (window as any).ethereum !== "undefined") {
    const injected = (window as any).ethereum;
    const provider = new ethers.BrowserProvider(injected);
    await injected.request?.({ method: "eth_requestAccounts" });
    await ensureHeLaNetwork(injected);
    s = await provider.getSigner();
  } else {
    throw new Error("No wallet available. Set VITE_WEB3AUTH_CLIENT_ID or install MetaMask.");
  }

  payrollContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, s!);
  signer = s!;

  const address = await s!.getAddress();
  return { address, contract: payrollContract, signer: s! };
}

/**
 * Disconnect Web3Auth session.
 */
export async function logoutWeb3Auth(): Promise<void> {
  if (web3auth) {
    await web3auth.logout();
    web3auth = null;
  }
  payrollContract = null;
  signer = null;
}

export function isConnected(): boolean {
  return !!signer && !!payrollContract;
}

/** Returns existing contract - use this instead of loginAndConnectContract for read calls */
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
    if (chainId?.toLowerCase() !== HELA_CHAIN_CONFIG.chainId.toLowerCase()) {
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
    }
  } catch {
    // ignore - network switch failure is non-fatal
  }
}
