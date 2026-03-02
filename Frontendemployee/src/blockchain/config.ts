/**
 * CorePayroll contract configuration for HeLa Testnet.
 *
 * BUG FIX: Was using hardcoded strings. Now reads from VITE_* env vars
 * (same pattern as frontpage/config.ts) so values can be overridden per environment.
 */

const CHAIN_ID = (import.meta as any).env?.VITE_HELA_CHAIN_ID || "0xA2D18";
const RPC_URL = (import.meta as any).env?.VITE_HELA_RPC_URL || "https://testnet-rpc.helachain.com";
const DISPLAY = (import.meta as any).env?.VITE_HELA_DISPLAY || "HeLa Testnet";
const TICKER_NAME = (import.meta as any).env?.VITE_HELA_TICKER_NAME || "HLUSD";
const TICKER = (import.meta as any).env?.VITE_HELA_TICKER || "HLUSD";

export const HELA_CHAIN_CONFIG = {
  chainNamespace: "eip155" as const,
  chainId: CHAIN_ID,
  rpcTarget: RPC_URL,
  displayName: DISPLAY,
  tickerName: TICKER_NAME,
  ticker: TICKER,
};

// ABI — employee portal only needs these functions
export const CORE_PAYROLL_ABI = [
  "function getTreasuryBalance() view returns (uint256)",
  "function claimableAmount(address _employee) view returns (uint256)",
  "function streams(address _employee) view returns (uint256 ratePerSecond, uint256 lastWithdrawTime, uint256 accruedBalance, bool isActive)",
  "function withdraw() external",
  "event Withdrawal(address indexed employee, uint256 netAmount, uint256 taxAmount)",
];
