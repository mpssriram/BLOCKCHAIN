import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  PauseCircle,
  Play,
  Save,
  ShieldCheck,
  SquareX,
  Wallet,
} from "lucide-react";
import {
  cancelStream,
  getBlockchainConfig,
  getEmployee,
  getEmployeeTransactions,
  pauseStream,
  recordStreamAction,
  setEmployeeTax,
  startStream,
  updateEmployeeWallet,
} from "../../lib/api";
import { loginAndConnectContract } from "../../blockchain/wallet";
import { CORE_PAYROLL_ABI, HELA_CHAIN_CONFIG } from "../../blockchain/config";
import { ethers } from "ethers";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageShell,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/dashboard/DashboardUI";

type StreamDetails = {
  ratePerSecond?: string;
  lastWithdrawTime?: number;
  accruedBalance?: string;
  isActive?: boolean;
};

type EmployeeRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  is_streaming?: boolean;
  wallet_address?: string | null;
  use_custom_tax?: boolean;
  custom_tax_rate?: number | null;
};

type TransactionRecord = {
  id: number;
  amount: number;
  tax_amount: number;
  description: string;
  timestamp: string;
};

function formatAmount(value: string | number | null | undefined, wei = false) {
  if (value === null || value === undefined || value === "") return "0";
  const amount = wei ? Number(ethers.formatEther(String(value))) : Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 6 }).format(amount)
    : "0";
}

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [ratePerSecond, setRatePerSecond] = useState("");
  const [streamDetails, setStreamDetails] = useState<StreamDetails | null>(null);
  const [claimableWei, setClaimableWei] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [taxSaving, setTaxSaving] = useState(false);

  const HELA_EXPLORER_ADDRESS = (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS || "";

  useEffect(() => {
    if (!id) return;
    loadEmployeeWorkspace(Number(id));
    getBlockchainConfig().then((cfg: any) => {
      const addr = (cfg?.contract_address || "").trim();
      if (addr) setContractAddress(addr);
    });
  }, [id]);

  async function loadEmployeeWorkspace(employeeId: number) {
    try {
      setLoading(true);
      setError("");
      const [employeeData, txData] = await Promise.all([
        getEmployee(employeeId),
        getEmployeeTransactions(employeeId),
      ]);
      setEmployee(employeeData);
      setTransactions(Array.isArray(txData) ? txData : []);
      setUseCustom(!!employeeData?.use_custom_tax);
      setCustomRate(
        employeeData?.custom_tax_rate !== null && employeeData?.custom_tax_rate !== undefined
          ? String(employeeData.custom_tax_rate)
          : ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee details.");
      setEmployee(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadStreamDetails() {
      if (!contractAddress || !employee?.wallet_address) {
        setStreamDetails(null);
        setClaimableWei(null);
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
        const roContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, provider);
        const [stream, claimable] = await Promise.all([
          roContract.streams(employee.wallet_address),
          roContract.claimableAmount(employee.wallet_address),
        ]);

        setStreamDetails({
          ratePerSecond:
            (stream.ratePerSecond && stream.ratePerSecond.toString?.()) || (stream[0] && stream[0].toString?.()),
          lastWithdrawTime:
            typeof stream.lastWithdrawTime === "bigint"
              ? Number(stream.lastWithdrawTime)
              : stream[1]
                ? Number(stream[1])
                : undefined,
          accruedBalance:
            (stream.accruedBalance && stream.accruedBalance.toString?.()) || (stream[2] && stream[2].toString?.()),
          isActive:
            typeof stream.isActive === "boolean" ? stream.isActive : typeof stream[3] === "boolean" ? stream[3] : undefined,
        });
        setClaimableWei(claimable.toString());
      } catch {
        setStreamDetails(null);
        setClaimableWei(null);
      }
    }

    loadStreamDetails();
  }, [contractAddress, employee?.wallet_address, employee?.is_streaming]);

  const streamStatus = useMemo(() => {
    if (!streamDetails) return employee?.is_streaming ? "Active" : "Not started";
    const active = !!streamDetails.isActive;
    const rate = streamDetails.ratePerSecond || "0";
    const hasRate = rate !== "0";
    const hasClaimable = !!claimableWei && claimableWei !== "0";

    if (active) return "Active";
    if (hasRate) return "Paused";
    if (hasClaimable) return "Cancelled";
    return "Not started";
  }, [claimableWei, employee?.is_streaming, streamDetails]);

  async function handleLinkWallet() {
    if (!id || !contractAddress) return;
    setOnChainLoading(true);
    try {
      const { address } = await loginAndConnectContract(contractAddress);
      await updateEmployeeWallet(Number(id), address);
      await loadEmployeeWorkspace(Number(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to link wallet");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handleSaveTax() {
    if (!employee) return;
    try {
      setTaxSaving(true);
      await setEmployeeTax(employee.id, useCustom, useCustom && customRate ? Number(customRate) : undefined);
      await loadEmployeeWorkspace(employee.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update tax settings");
    } finally {
      setTaxSaving(false);
    }
  }

  async function handleStartOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) {
      alert("Employee must have a linked HeLa wallet first");
      return;
    }

    const rate = ratePerSecond ? ethers.parseEther(ratePerSecond) : null;
    if (!rate || rate <= 0n) {
      alert("Enter a valid HLUSD per-second rate");
      return;
    }

    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.startStream(employee.wallet_address, rate);
      await tx.wait();
      await startStream(Number(id));
      await recordStreamAction(Number(id), tx.hash, "start", rate.toString());
      await loadEmployeeWorkspace(Number(id));
      setRatePerSecond("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handlePauseOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) return;
    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.stopStream(employee.wallet_address);
      await tx.wait();
      await pauseStream(Number(id));
      await recordStreamAction(Number(id), tx.hash, "pause");
      await loadEmployeeWorkspace(Number(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pause stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handleCancelOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) return;
    if (!confirm("Cancel this stream? Accrued HLUSD stays claimable, but future streaming stops until HR starts a new stream.")) {
      return;
    }

    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.cancelStream(employee.wallet_address);
      await tx.wait();
      await cancelStream(Number(id));
      await recordStreamAction(Number(id), tx.hash, "cancel");
      await loadEmployeeWorkspace(Number(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  const statusTone =
    streamStatus === "Active"
      ? "active"
      : streamStatus === "Paused"
        ? "paused"
        : streamStatus === "Cancelled"
          ? "danger"
          : "neutral";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Employee details"
        title={employee?.name || "Employee payroll control"}
        description="Review employee identity, wallet readiness, tax overrides, stream status, and salary transaction history from one focused control page."
        actions={
          <ActionButton variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </ActionButton>
        }
      />

      {loading ? <LoadingState label="Loading employee workspace..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={() => id && loadEmployeeWorkspace(Number(id))} /> : null}

      {!loading && !error && employee ? (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <StatCard label="Stream status" value={streamStatus} icon={Play} accent="cyan" detail="Derived from current contract read plus backend stream marker." />
            <StatCard label="Claimable balance" value={`${formatAmount(claimableWei, true)} HLUSD`} icon={Wallet} accent="emerald" detail="Shown from contract read when wallet and contract are available." />
            <StatCard label="Wallet status" value={employee.wallet_address ? "Linked" : "Not linked"} icon={ShieldCheck} accent="violet" detail="Wallet linking is required before wallet-dependent stream actions can run." />
            <StatCard label="Recorded transactions" value={String(transactions.length)} icon={Save} accent="amber" detail="Transaction history is based on backend-recorded salary or bonus events." />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              eyebrow="Identity and wallet"
              title="Employee profile"
              description="Use this section to review the employee record and prepare wallet-dependent actions."
              actions={<StatusBadge tone={statusTone}>{streamStatus}</StatusBadge>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Identity</p>
                  <p className="mt-4 text-xl font-semibold text-white">{employee.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{employee.email}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{employee.role}</p>
                </div>

                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Wallet status</p>
                  {employee.wallet_address ? (
                    <>
                      <p className="mt-4 break-all text-sm font-medium text-white">{employee.wallet_address}</p>
                      {HELA_EXPLORER_ADDRESS ? (
                        <a
                          href={`${HELA_EXPLORER_ADDRESS}${employee.wallet_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-200 hover:underline"
                        >
                          View on explorer
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-sm text-slate-300">No HeLa wallet linked yet.</p>
                      <div className="mt-4">
                        <ActionButton variant="primary" onClick={handleLinkWallet} disabled={onChainLoading}>
                          <Wallet className="h-4 w-4" />
                          {onChainLoading ? "Linking..." : "Link wallet"}
                        </ActionButton>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Tax settings"
              title="Employee tax override"
              description="Use custom tax only when this employee should deviate from the company default. Backend validation still governs final saved state."
            >
              <div className="space-y-4">
                <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={useCustom}
                    onChange={(e) => setUseCustom(e.target.checked)}
                    className="h-4 w-4 accent-cyan-300"
                  />
                  Use custom employee tax rate
                </label>

                <input
                  type="number"
                  placeholder="Custom tax %"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  disabled={!useCustom}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none disabled:opacity-50"
                />

                <div className="rounded-[1.35rem] border border-amber-300/12 bg-amber-500/8 px-4 py-4 text-sm leading-7 text-slate-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-1 h-4 w-4 text-amber-300" />
                    <p>
                      Tax overrides affect backend-recorded payroll calculations. This does not claim to change any fixed on-chain contract tax rule unless the contract itself supports it.
                    </p>
                  </div>
                </div>

                <ActionButton variant="primary" onClick={handleSaveTax} disabled={taxSaving}>
                  <Save className="h-4 w-4" />
                  {taxSaving ? "Saving..." : "Save tax settings"}
                </ActionButton>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Stream controls"
            title="Wallet-connected stream actions"
            description="These actions depend on the employee wallet, the configured contract address, and successful wallet interaction. Do not treat action initiation as on-chain confirmation beyond the current implemented flow."
          >
            <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Current stream snapshot</p>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <p>Rate: {streamDetails?.ratePerSecond ? `${formatAmount(streamDetails.ratePerSecond, true)} HLUSD/sec` : "Not set"}</p>
                  <p>Accrued: {streamDetails?.accruedBalance ? `${formatAmount(streamDetails.accruedBalance, true)} HLUSD` : "0 HLUSD"}</p>
                  <p>
                    Last withdraw:{" "}
                    {streamDetails?.lastWithdrawTime
                      ? new Date(streamDetails.lastWithdrawTime * 1000).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <label className="block text-xs uppercase tracking-[0.22em] text-slate-500">Rate (HLUSD / second)</label>
                  <input
                    type="text"
                    placeholder="0.0001"
                    value={ratePerSecond}
                    onChange={(e) => setRatePerSecond(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                  />
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Use this to start a first stream or resume with a fresh rate.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton variant="primary" onClick={handleStartOnChainStream} disabled={onChainLoading}>
                    <Play className="h-4 w-4" />
                    {onChainLoading ? "Submitting..." : "Start / resume"}
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={handlePauseOnChainStream}
                    disabled={onChainLoading || streamStatus !== "Active"}
                  >
                    <PauseCircle className="h-4 w-4" />
                    Pause
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    onClick={handleCancelOnChainStream}
                    disabled={onChainLoading || streamStatus === "Not started"}
                  >
                    <SquareX className="h-4 w-4" />
                    Cancel
                  </ActionButton>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="History"
            title="Recorded transaction history"
            description="These rows reflect backend-recorded payroll transactions and should be interpreted as application records rather than a complete chain index."
          >
            {transactions.length === 0 ? (
              <EmptyState
                title="No recorded transactions yet"
                description="Once salary or bonus events are recorded through the backend flow, transaction history will appear here."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#08111d]">
                <div className="hidden grid-cols-[1.1fr_0.75fr_0.75fr_0.9fr] gap-4 border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 lg:grid">
                  <span>Description</span>
                  <span>Net amount</span>
                  <span>Tax</span>
                  <span>Timestamp</span>
                </div>
                <div className="divide-y divide-white/8">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.1fr_0.75fr_0.75fr_0.9fr] lg:items-center">
                      <div>
                        <p className="font-medium text-white">{tx.description || "Payroll transaction"}</p>
                        <p className="text-xs text-slate-500">Transaction #{tx.id}</p>
                      </div>
                      <p className="text-sm text-slate-300">Rs {formatAmount(tx.amount)}</p>
                      <p className="text-sm text-slate-300">Rs {formatAmount(tx.tax_amount)}</p>
                      <p className="text-sm text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}
