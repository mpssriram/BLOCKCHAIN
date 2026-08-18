import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  CreditCard,
  Menu,
  RefreshCw,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { HELA_CHAIN_CONFIG } from "../blockchain/config";
import { ensureHeLaNetwork, getPayrollContract, loginAndConnectContract, reconnectIfLoggedIn } from "../blockchain/wallet";
import { PersonalSetup } from "../components/profile/PersonalSetup";
import { TransactionGraph } from "../components/transactions/TransactionGraph";
import { TransactionHistory } from "../components/transactions/TransactionHistory";
import { StatCard } from "../components/ui/StatCard";
import { TowerLoader } from "../components/ui/TowerLoader";
import { Sidebar } from "../layouts/employee/Sidebar";
import { exchangePortalHandoff, getBlockchainConfig, getMyProfile, getMyTransactions, recordMyWithdrawal, updateMyWallet } from "../lib/api";

type ProfileResponse = {
  email?: string;
  total_earned?: number;
  employee?: {
    id?: number;
    name?: string;
    role?: string;
    wallet_address?: string | null;
    is_streaming?: boolean;
  };
  name?: string;
};

type TransactionRecord = {
  id?: number;
  amount: string | number;
  description?: string;
  timestamp: string;
};

type PageMeta = {
  title: string;
  description: string;
};

function EmployeePortal() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [claimableWei, setClaimableWei] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [streamRateWei, setStreamRateWei] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function getReadOnlyContract() {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
    return new ethers.Contract(
      contractAddress,
      [
        "function claimableAmount(address _employee) view returns (uint256)",
        "function streams(address _employee) view returns (uint256 ratePerSecond, uint256 lastWithdrawTime, uint256 accruedBalance, bool isActive)",
      ],
      provider
    );
  }

  useEffect(() => {
    const loadPortal = async () => {
      const params = new URLSearchParams(window.location.search);
      const handoffCode = params.get("handoff");
      if (handoffCode) {
        try {
          const session = await exchangePortalHandoff(handoffCode);
          localStorage.setItem("token", session.access_token);
          params.delete("handoff");
          const query = params.toString();
          window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
        } catch {
          localStorage.removeItem("token");
        }
      }

      if (!localStorage.getItem("token")) {
        const loginUrl = (import.meta as any).env?.VITE_EMPLOYEE_LOGIN_URL || "http://localhost:5173/employee-login";
        window.location.href = loginUrl;
        return;
      }

      try {
        const [profileData, transactionData, config]: [ProfileResponse, TransactionRecord[], any] = await Promise.all([
          getMyProfile(),
          getMyTransactions(),
          getBlockchainConfig(),
        ]);
        setProfile(profileData);
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
        const address = config?.contract_address || null;
        if (address) setContractAddress(address);

        if (address) {
          reconnectIfLoggedIn(address).then((reconnectedAddress) => {
            if (reconnectedAddress) {
              setWalletAddress(reconnectedAddress);
            } else if (profileData?.employee?.wallet_address) {
              setWalletAddress(profileData.employee.wallet_address);
            }
          });
        } else if (profileData?.employee?.wallet_address) {
          setWalletAddress(profileData.employee.wallet_address);
        }
      } catch {
        // The API client handles expired sessions by returning to the employee login page.
      } finally {
        setLoading(false);
      }
    };

    void loadPortal();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  async function loadClaimable(addr?: string) {
    const targetAddress = addr ?? walletAddress;
    if (!contractAddress || !targetAddress) return;

    try {
      const contract = getPayrollContract() ?? getReadOnlyContract();
      if (!contract) return;
      const [amount, stream] = await Promise.all([
        contract.claimableAmount(targetAddress),
        contract.streams(targetAddress),
      ]);
      setClaimableWei(amount.toString());

      if (stream) {
        const rate =
          (stream.ratePerSecond && stream.ratePerSecond.toString?.()) ||
          (stream[0] && stream[0].toString?.()) ||
          null;
        const active =
          typeof stream.isActive === "boolean"
            ? stream.isActive
            : typeof stream[3] === "boolean"
              ? stream[3]
              : null;

        setStreamRateWei(rate);
        setStreamActive(active);
      }
    } catch {
      setClaimableWei(null);
      setStreamRateWei(null);
      setStreamActive(null);
    }
  }

  useEffect(() => {
    if (walletAddress && contractAddress) {
      loadClaimable();
    }
  }, [walletAddress, contractAddress]);

  async function handleConnectWallet() {
    if (!contractAddress) return;

    try {
      const { address } = await loginAndConnectContract(contractAddress);
      setWalletAddress(address);
      try {
        await updateMyWallet(address);
      } catch (saveErr: any) {
        alert(`Wallet connected but failed to save to account: ${saveErr?.message || "Unknown error"}`);
      }
      await loadClaimable(address);
    } catch (err: any) {
      alert(err?.message || "Failed to connect wallet");
    }
  }

  async function handleWithdraw() {
    if (!contractAddress || !walletAddress) return;

    setWithdrawLoading(true);
    try {
      const withdrawAmount = claimableWei ? Number(ethers.formatEther(claimableWei)) : 0;
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.withdraw();
      await tx.wait();
      try {
        await recordMyWithdrawal(tx.hash, withdrawAmount);
      } catch (recordErr: any) {
        alert(`Withdrawal succeeded but failed to record in backend: ${recordErr?.message || "Unknown error"}`);
      }
      await loadClaimable();
    } catch (err: any) {
      alert(err?.message || "Withdraw failed");
    } finally {
      setWithdrawLoading(false);
    }
  }

  function formatTimeAgo(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  const totalEarned = profile?.total_earned ?? 0;
  const displayName = profile?.employee?.name || profile?.name || "User";

  const stats = useMemo(() => {
    const now = new Date();
    const monthlyIncome = transactions
      .filter((transaction) => {
        const date = new Date(transaction.timestamp);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      totalBalance: totalEarned,
      monthlyIncome,
      monthlyExpenses: "Not tracked",
      nextPayrollDate: "Check with payroll",
      availableBalance: totalEarned,
    };
  }, [transactions, totalEarned]);

  const currentPageMeta = useMemo<PageMeta>(() => {
    switch (activeTab) {
      case "overview":
        return {
          title: "Employee overview",
          description: "Recorded payouts, wallet status, and contract-linked salary activity in one workspace.",
        };
      case "personal":
        return {
          title: "Profile",
          description: "Employee identity fields and stream-related account details currently stored in the app.",
        };
      case "transactions":
        return {
          title: "Transactions",
          description: "Recorded transaction charts and searchable payout history.",
        };
      case "history":
        return {
          title: "History",
          description: "A clean ledger view of backend-recorded payroll entries.",
        };
      default:
        return {
          title: "Employee workspace",
          description: "Your payroll activity and wallet-linked employee account.",
        };
    }
  }, [activeTab]);

  const streamRateInfo = useMemo(() => {
    if (!streamRateWei) return null;
    let perSecond = 0;

    try {
      perSecond = Number(ethers.formatEther(streamRateWei));
    } catch {
      perSecond = 0;
    }

    if (!perSecond) return null;
    const perMonth = perSecond * 30 * 24 * 3600;
    return { perSecond, perMonth };
  }, [streamRateWei]);

  const recentActivities = useMemo(
    () =>
      transactions.slice(0, 5).map((transaction) => ({
        type: "income" as const,
        title: transaction.description || "Payment",
        amount: Number(transaction.amount),
        time: formatTimeAgo(transaction.timestamp),
      })),
    [transactions]
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="employee-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white shadow-lg">
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Employee Account</p>
              <p className="mt-1 text-2xl font-semibold text-white">{displayName}</p>
              <p className="text-sm text-slate-400">{profile?.email || "--"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!walletAddress ? (
              <button
                onClick={handleConnectWallet}
                className="rounded-2xl bg-white px-5 py-3 text-slate-950 transition hover:bg-cyan-50"
              >
                Link Wallet
              </button>
            ) : (
              <span className={`rounded-2xl px-4 py-3 text-sm font-medium ${streamActive ? "bg-emerald-300/12 text-emerald-200" : "bg-amber-300/12 text-amber-200"}`}>
                {streamActive ? "Stream Active" : "Stream Paused"}
              </span>
            )}
            {!walletAddress && typeof (window as any).ethereum !== "undefined" ? (
              <button
                onClick={() => ensureHeLaNetwork((window as any).ethereum)}
                className="rounded-2xl bg-cyan-600 px-5 py-3 text-white transition hover:bg-cyan-700"
              >
                Add HeLa Network
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Recorded Payouts</p>
            <p className="mt-2 text-xl font-semibold">{Number(totalEarned).toLocaleString()} HLUSD</p>
            <p className="mt-1 text-sm text-slate-300">Historical payout records stored by the backend.</p>
          </div>
          <div className="employee-card rounded-2xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Wallet State</p>
            <p className="mt-2 text-sm font-medium text-white">
              {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "Not linked yet"}
            </p>
            <p className="mt-1 text-sm text-slate-400">Saved wallet syncs with your payroll access.</p>
          </div>
          <div className="employee-card rounded-2xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Payroll Timing</p>
            <p className="mt-2 text-sm font-medium text-white">{stats.nextPayrollDate}</p>
            <p className="mt-1 text-sm text-slate-400">Use your payroll team or dashboard notices for the next scheduled review.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-6 w-6" />}
          title="Total Available Balance"
          value={`${stats.availableBalance.toLocaleString()} HLUSD`}
          subtitle="Recorded total"
          iconBg="bg-cyan-600"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Monthly Income"
          value={`${stats.monthlyIncome.toLocaleString()} HLUSD`}
          subtitle="Recorded this month"
          iconBg="bg-emerald-500"
        />
        <StatCard
          icon={<CreditCard className="h-6 w-6" />}
          title="Monthly Expenses"
          value={stats.monthlyExpenses}
          subtitle="Not tracked in the current employee portal"
          iconBg="bg-rose-500"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          title="Next Payroll Date"
          value={stats.nextPayrollDate}
          subtitle="Reference only"
          iconBg="bg-slate-900"
        />
      </div>

      {contractAddress ? (
        <section className="employee-panel rounded-[2rem] p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">On-chain PayStream (HeLa Testnet)</h3>
          <p className="mb-4 text-sm leading-7 text-slate-400">
            Contract reads show claimable salary and stream posture when a wallet and contract are available.
          </p>
          {!walletAddress ? (
            <button
              onClick={handleConnectWallet}
              className="rounded-2xl bg-white px-6 py-3 text-slate-950 transition hover:bg-cyan-50"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </p>
              <p className="text-lg font-semibold text-cyan-200">
                Claimable: {claimableWei ? `${ethers.formatEther(claimableWei)} HLUSD` : "0 HLUSD"}
              </p>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !claimableWei || claimableWei === "0"}
                className="rounded-2xl bg-cyan-600 px-6 py-3 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {withdrawLoading ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          )}

          {walletAddress ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                onClick={() => loadClaimable()}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white shadow-sm transition hover:bg-white/[0.08]"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Stream
                </span>
              </button>
              <a
                href={
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                    ? `${(import.meta as any).env.VITE_HELA_EXPLORER_ADDRESS}${walletAddress}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl px-4 py-3 text-center ${
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                    : "cursor-not-allowed bg-white/8 text-slate-500"
                }`}
              >
                View Wallet on HeLa
              </a>
              <a
                href={
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS && contractAddress
                    ? `${(import.meta as any).env.VITE_HELA_EXPLORER_ADDRESS}${contractAddress}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl px-4 py-3 text-center ${
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                    ? "bg-white text-slate-950 hover:bg-cyan-50"
                    : "cursor-not-allowed bg-white/8 text-slate-500"
                }`}
              >
                View Contract
              </a>
            </div>
          ) : null}

          {walletAddress && streamRateInfo ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="employee-card rounded-2xl p-4">
                <p className="mb-1 text-xs text-cyan-200">Live Stream Rate</p>
                <p className="text-sm font-semibold text-white">
                  {streamRateInfo.perSecond.toFixed(6)} HLUSD/sec
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Approx {streamRateInfo.perMonth.toFixed(2)} HLUSD per 30 days
                </p>
                {streamActive === false ? (
                  <p className="mt-1 text-xs text-rose-300">Stream is currently paused</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <TransactionGraph transactions={transactions} />

      <section className="employee-panel rounded-[2rem] p-6">
        <h3 className="mb-2 text-xl font-semibold text-white">Recorded payout timeline</h3>
        <p className="mb-4 text-sm leading-7 text-slate-400">
          A compact visual of recent backend-recorded payout amounts.
        </p>
        {transactions.length === 0 ? (
          <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm leading-7 text-slate-300">
            No payout records are available yet. Once payroll entries are recorded, they will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction, index) => {
              const amount = Number(transaction.amount) || 0;
              const maxAmount = Math.max(1, ...transactions.slice(0, 10).map((item) => Number(item.amount) || 0));
              const pct = Math.min(100, Math.round((amount / maxAmount) * 100));

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-400">{new Date(transaction.timestamp).toLocaleDateString()}</div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-sm font-medium text-slate-200">{amount.toLocaleString()} HLUSD</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="employee-panel rounded-[2rem] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent activity</h3>
          <span className="text-sm font-medium text-cyan-200">{recentActivities.length} items</span>
        </div>
        {recentActivities.length === 0 ? (
          <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm leading-7 text-slate-300">
            No recent activity has been recorded yet for this employee account.
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-3 ${activity.type === "income" ? "bg-emerald-300/12 text-emerald-200" : "bg-rose-300/12 text-rose-200"}`}>
                    {activity.type === "income" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{activity.title}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
                <p className={`font-semibold ${activity.type === "income" ? "text-emerald-200" : "text-rose-200"}`}>
                  {activity.type === "income" ? "+" : "-"}
                  {activity.amount.toLocaleString()} HLUSD
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "personal":
        return <PersonalSetup profile={profile} />;
      case "transactions":
        return (
          <div className="space-y-6">
            <TransactionGraph transactions={transactions} />
            <TransactionHistory transactions={transactions} />
          </div>
        );
      case "history":
        return <TransactionHistory transactions={transactions} />;
      default:
        return null;
    }
  };

  return (
    <div className="employee-shell relative min-h-screen text-white">
      <div className="employee-grid absolute inset-0 opacity-35" />
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-[140px]" />

      <div className="relative flex min-h-screen flex-col xl:flex-row">
        <div className="hidden xl:block">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            <div className="relative h-full w-[320px] max-w-[86vw] border-r border-white/10 bg-[#06111d] p-5 shadow-[0_32px_90px_rgba(2,6,23,0.5)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/75">Navigation</p>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="employee-panel mb-8 rounded-[2rem] px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white xl:hidden"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Employee workspace</p>
                    <h1 className="mb-2 text-3xl font-bold text-white">{currentPageMeta.title}</h1>
                    <p className="max-w-3xl text-slate-300">{currentPageMeta.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Backend records
                  </span>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    HeLa linked
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="employee-panel rounded-[2rem] px-6 py-12 text-slate-200">
                <TowerLoader className="py-6" label="Loading your employee workspace..." />
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default EmployeePortal;
