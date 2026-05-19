import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Landmark,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  depositTreasury,
  getAuthRole,
  getBlockchainConfig,
  getTreasury,
  getTreasurySummary,
  syncTreasury,
  withdrawTreasury,
} from "../../lib/api";
import { loginAndConnectContract, logoutWallet, isConnected, getConnectedAddress } from "../../blockchain/wallet";
import { ethers } from "ethers";
import { HELA_CHAIN_CONFIG, CORE_PAYROLL_ABI } from "../../blockchain/config";
import {
  ActionButton,
  ErrorState,
  LoadingState,
  PageHeader,
  PageShell,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/dashboard/DashboardUI";

type TreasuryRecord = {
  id: number;
  total_balance: number;
  onchain_balance: number;
  last_tx_hash?: string | null;
  last_synced_at?: string | null;
};

type TreasurySummary = {
  health?: {
    status?: "safe" | "warning" | "critical";
    total_rate?: number;
    runway_sec?: number;
    is_low_treasury?: boolean;
  };
  recent_transactions?: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function Treasury() {
  const authRole = getAuthRole();
  const canRunEmergencyActions = authRole === "admin";
  const [treasury, setTreasury] = useState<TreasuryRecord | null>(null);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [onChainAmount, setOnChainAmount] = useState("");
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [taxVault, setTaxVault] = useState<string | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [web2Loading, setWeb2Loading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");

  const HELA_EXPLORER_TX = (import.meta as any).env?.VITE_HELA_EXPLORER_TX || "";
  const HELA_EXPLORER_ADDRESS = (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS || "";

  useEffect(() => {
    loadTreasuryWorkspace();
    loadBlockchainConfig();
    if (isConnected()) {
      getConnectedAddress().then((addr) => setWalletAddress(addr));
    }
  }, []);

  async function loadBlockchainConfig() {
    try {
      const cfg = await getBlockchainConfig();
      const addr = (cfg?.contract_address || "").trim();
      const zeroAddr = "0x0000000000000000000000000000000000000000";
      if (addr && addr.toLowerCase() !== zeroAddr.toLowerCase()) {
        setContractAddress(addr);
      }
    } catch {
      setContractAddress(null);
    }
  }

  useEffect(() => {
    async function loadTaxInfo() {
      if (!contractAddress) {
        setTaxRate(null);
        setTaxVault(null);
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
        const roContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, provider);
        const [rate, vault] = await Promise.all([
          roContract.TAX_RATE?.().catch(() => null),
          roContract.taxVault?.().catch(() => null),
        ]);
        if (rate !== null && rate !== undefined) setTaxRate(Number(rate));
        if (vault) setTaxVault(String(vault));
      } catch {
        setTaxRate(null);
        setTaxVault(null);
      }
    }
    loadTaxInfo();
  }, [contractAddress]);

  async function loadTreasuryWorkspace() {
    try {
      setLoading(true);
      setError("");
      const [treasuryData, summaryData] = await Promise.all([getTreasury(), getTreasurySummary()]);
      setTreasury(treasuryData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load treasury.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!amount) return;
    try {
      setWeb2Loading(true);
      await depositTreasury(Number(amount));
      setAmount("");
      await loadTreasuryWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setWeb2Loading(false);
    }
  }

  async function handleWithdraw() {
    if (!amount) return;
    try {
      setWeb2Loading(true);
      await withdrawTreasury(Number(amount));
      setAmount("");
      await loadTreasuryWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWeb2Loading(false);
    }
  }

  async function handleSyncTreasury() {
    try {
      setSyncLoading(true);
      setSyncFeedback("");
      await syncTreasury();
      setSyncFeedback("Treasury sync completed.");
      await loadTreasuryWorkspace();
    } catch (err) {
      setSyncFeedback(err instanceof Error ? err.message : "Treasury sync is unavailable.");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleConnectWallet() {
    if (!contractAddress) {
      alert("Contract not configured.");
      return;
    }
    try {
      setConnectLoading(true);
      const { address } = await loginAndConnectContract(contractAddress);
      setWalletAddress(address);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleDisconnectWallet() {
    await logoutWallet();
    setWalletAddress(null);
  }

  async function handleOnChainDeposit() {
    if (!onChainAmount || !contractAddress) return;
    try {
      setOnChainLoading(true);
      const { signer } = await loginAndConnectContract(contractAddress);
      const valueWei = ethers.parseEther(onChainAmount);
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: valueWei,
      });
      await tx.wait();
      setOnChainAmount("");
      setWalletAddress(await signer.getAddress());
      await loadTreasuryWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "On-chain deposit failed");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handleEmergencyWithdraw() {
    if (!contractAddress) return;
    if (!canRunEmergencyActions) {
      alert("Only an admin can trigger emergency withdrawal.");
      return;
    }
    if (!confirm("Withdraw the entire contract treasury to the admin wallet?")) return;
    try {
      setEmergencyLoading(true);
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.emergencyWithdraw();
      await tx.wait();
      await loadTreasuryWorkspace();
      alert("Emergency withdrawal completed");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Emergency withdrawal failed");
    } finally {
      setEmergencyLoading(false);
    }
  }

  const healthTone =
    summary?.health?.status === "safe"
      ? "active"
      : summary?.health?.status === "warning"
        ? "warning"
        : summary?.health?.status === "critical"
          ? "danger"
          : "neutral";

  const syncUnavailable = useMemo(
    () => syncFeedback.toLowerCase().includes("not implemented") || syncFeedback.toLowerCase().includes("unavailable"),
    [syncFeedback]
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Treasury"
        title="Treasury operations console"
        description="Manage backend-recorded treasury balances, wallet-connected contract funding, and clearly distinguish app-side reporting from live chain state."
        actions={
          <ActionButton variant="secondary" onClick={handleSyncTreasury} disabled={syncLoading}>
            <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
            {syncLoading ? "Syncing..." : "Sync treasury"}
          </ActionButton>
        }
      />

      {loading ? <LoadingState label="Loading treasury console..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={loadTreasuryWorkspace} /> : null}

      {!loading && !error && treasury ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Backend balance" value={`Rs ${formatCurrency(treasury.total_balance)}`} detail="Application-recorded treasury balance." icon={Landmark} accent="emerald" />
            <StatCard label="Recorded on-chain balance" value={`Rs ${formatCurrency(treasury.onchain_balance)}`} detail="Shown from backend state, not a guaranteed live read." icon={Wallet} accent="cyan" />
            <StatCard label="Treasury health" value={summary?.health?.status || "unknown"} detail={summary?.health?.runway_sec ? `${(summary.health.runway_sec / 86400).toFixed(1)} days runway` : "Runway unavailable"} icon={ShieldAlert} accent="amber" />
            <StatCard label="Recent activity count" value={String(summary?.recent_transactions || 0)} detail="Recent backend-recorded transaction volume in treasury summary." icon={ArrowUpRight} accent="violet" />
          </div>

          {syncFeedback ? (
            <div className={`rounded-[1.45rem] border px-5 py-4 text-sm leading-7 ${syncUnavailable ? "border-amber-300/18 bg-amber-500/8 text-slate-200" : "border-emerald-300/18 bg-emerald-500/8 text-slate-200"}`}>
              {syncFeedback}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              eyebrow="State clarity"
              title="Backend state versus on-chain state"
              description="Treasury UI should make it obvious when data comes from backend records, when wallet actions are available, and when sync is unavailable."
            >
              <div className="space-y-4">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-1 h-4 w-4 text-amber-300" />
                    <p className="text-sm leading-7 text-slate-300">
                      The smart contract remains the source of truth for real treasury movement. Backend treasury fields are application records unless explicitly refreshed from a real chain sync.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Health status</p>
                    <div className="mt-4">
                      <StatusBadge tone={healthTone}>{summary?.health?.status || "unknown"}</StatusBadge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      Total payroll rate: {summary?.health?.total_rate ? summary.health.total_rate.toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Last sync timestamp</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {treasury.last_synced_at ? new Date(treasury.last_synced_at).toLocaleString() : "Not synced yet"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Manage treasury"
              title="Backend-recorded deposits and withdrawals"
              description="These controls affect backend treasury records. Contract-side treasury funding remains a separate wallet action below."
            >
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                />
                <div className="flex flex-wrap gap-3">
                  <ActionButton variant="primary" onClick={handleDeposit} disabled={web2Loading}>
                    {web2Loading ? "Working..." : "Deposit"}
                  </ActionButton>
                  <ActionButton variant="danger" onClick={handleWithdraw} disabled={web2Loading}>
                    {web2Loading ? "Working..." : "Withdraw"}
                  </ActionButton>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Wallet-connected treasury"
            title="Contract funding and emergency recovery"
            description="Use browser wallet actions for direct contract funding. Emergency withdraw remains restricted to admin accounts."
          >
            <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Contract info</p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
                    <p>Contract: {contractAddress || "Not configured"}</p>
                    <p>Tax rate: {taxRate !== null ? `${taxRate}%` : "Unavailable"}</p>
                    <p>Tax vault: {taxVault || "Unavailable"}</p>
                  </div>
                </div>
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Connected wallet</p>
                  {walletAddress ? (
                    <>
                      <p className="mt-4 break-all text-sm text-white">{walletAddress}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <ActionButton variant="secondary" onClick={handleDisconnectWallet}>
                          Disconnect
                        </ActionButton>
                        {HELA_EXPLORER_ADDRESS && contractAddress ? (
                          <a
                            href={`${HELA_EXPLORER_ADDRESS}${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
                          >
                            View contract
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="mt-4">
                      <ActionButton variant="primary" onClick={handleConnectWallet} disabled={connectLoading}>
                        <Wallet className="h-4 w-4" />
                        {connectLoading ? "Connecting..." : "Connect wallet"}
                      </ActionButton>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <label className="block text-xs uppercase tracking-[0.22em] text-slate-500">On-chain deposit amount (HLUSD)</label>
                  <input
                    type="text"
                    placeholder="0.1"
                    value={onChainAmount}
                    onChange={(e) => setOnChainAmount(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton variant="primary" onClick={handleOnChainDeposit} disabled={!onChainAmount || onChainLoading}>
                      {onChainLoading ? "Depositing..." : "Deposit to contract"}
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={handleEmergencyWithdraw}
                      disabled={emergencyLoading || !canRunEmergencyActions}
                    >
                      {emergencyLoading ? "Withdrawing..." : "Emergency withdraw"}
                    </ActionButton>
                  </div>
                  {!canRunEmergencyActions ? (
                    <p className="mt-4 text-sm leading-7 text-amber-200">
                      Emergency withdraw is reserved for admin accounts and should be treated as a high-risk recovery action.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Latest treasury record</p>
                  <p className="mt-4 break-all text-sm text-slate-300">
                    {treasury.last_tx_hash || "No treasury transaction recorded yet"}
                  </p>
                  {treasury.last_tx_hash && HELA_EXPLORER_TX ? (
                    <a
                      href={`${HELA_EXPLORER_TX}${treasury.last_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:underline"
                    >
                      Open transaction on explorer
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}

export default Treasury;
