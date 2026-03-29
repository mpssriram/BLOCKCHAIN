/**
 * CorePayroll contract configuration for HeLa.
 *
 * BUG FIX: Was using hardcoded strings. Now reads from VITE_* env vars
 * with shared defaults for both testnet and mainnet.
 */

export const HELA_NETWORKS = {
  testnet: {
    chainId: "0xA2D18",
    rpcTarget: "https://testnet-rpc.helachain.com",
    displayName: "HeLa Testnet",
    tickerName: "HLUSD",
    ticker: "HLUSD",
    blockExplorerUrl: "https://testnet-blockexplorer.helachain.com",
  },
  mainnet: {
    chainId: "0x21DC",
    rpcTarget: "https://mainnet-rpc.helachain.com",
    displayName: "HeLa Official Runtime",
    tickerName: "HLUSD",
    ticker: "HLUSD",
    blockExplorerUrl: "https://helascan.io/",
  },
} as const;

export const HELA_ACTIVE_NETWORK =
  ((import.meta as any).env?.VITE_HELA_NETWORK as keyof typeof HELA_NETWORKS) || "testnet";

const DEFAULT_HELA_CHAIN = HELA_NETWORKS[HELA_ACTIVE_NETWORK] || HELA_NETWORKS.testnet;

export const HELA_CHAIN_CONFIG = {
  chainNamespace: "eip155" as const,
  chainId: (import.meta as any).env?.VITE_HELA_CHAIN_ID || DEFAULT_HELA_CHAIN.chainId,
  rpcTarget: (import.meta as any).env?.VITE_HELA_RPC_URL || DEFAULT_HELA_CHAIN.rpcTarget,
  displayName: (import.meta as any).env?.VITE_HELA_DISPLAY || DEFAULT_HELA_CHAIN.displayName,
  tickerName: (import.meta as any).env?.VITE_HELA_TICKER_NAME || DEFAULT_HELA_CHAIN.tickerName,
  ticker: (import.meta as any).env?.VITE_HELA_TICKER || DEFAULT_HELA_CHAIN.ticker,
  blockExplorerUrl:
    (import.meta as any).env?.VITE_HELA_EXPLORER_BASE || DEFAULT_HELA_CHAIN.blockExplorerUrl,
};

// ABI — employee portal only needs these functions
export const CORE_PAYROLL_ABI = [
  "function getTreasuryBalance() view returns (uint256)",
  "function claimableAmount(address _employee) view returns (uint256)",
  "function streams(address _employee) view returns (uint256 ratePerSecond, uint256 lastWithdrawTime, uint256 accruedBalance, bool isActive)",
  "function withdraw() external",
  "function cancelStream(address _employee) external",
  "event Withdrawal(address indexed employee, uint256 netAmount, uint256 taxAmount)",
];
