/**
 * CorePayroll contract configuration for HeLa Testnet.
 * Step 3 from Web3Auth integration guide.
 */

export const HELA_CHAIN_CONFIG = {
  chainNamespace: "eip155" as const,
  chainId: "0xA2D18", // 666888 in hex (HeLa Testnet ID)
  rpcTarget: "https://testnet-rpc.helachain.com",
  displayName: "HeLa Testnet",
  tickerName: "HLUSD",
  ticker: "HLUSD",
};

export const CORE_PAYROLL_ABI = [
  "function getTreasuryBalance() view returns (uint256)",
  "function startStream(address _employee, uint256 _ratePerSecond) external",
  "function stopStream(address _employee) external",
  "function claimableAmount(address _employee) view returns (uint256)",
  "function streams(address _employee) view returns (uint256 ratePerSecond, uint256 lastWithdrawTime, uint256 accruedBalance, bool isActive)",
  "function TAX_RATE() view returns (uint256)",
  "function taxVault() view returns (address)",
  "function withdraw() external",
  "function emergencyWithdraw() external",
  "event StreamStarted(address indexed employee, uint256 rate)",
  "event StreamStopped(address indexed employee)",
  "event Withdrawal(address indexed employee, uint256 netAmount, uint256 taxAmount)",
  "event TreasuryFunded(uint256 amount)",
  "receive() external payable",
];
