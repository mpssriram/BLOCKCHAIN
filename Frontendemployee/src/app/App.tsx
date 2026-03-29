import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { TransactionGraph } from './components/TransactionGraph';
import { TransactionHistory } from './components/TransactionHistory';
import { PersonalSetup } from './components/PersonalSetup';
import { getMyProfile, getMyTransactions, getBlockchainConfig, updateMyWallet } from './api';
import { loginAndConnectContract, reconnectIfLoggedIn, getPayrollContract, ensureHeLaNetwork } from '../blockchain/web3Auth';
import { HELA_CHAIN_CONFIG } from '../blockchain/config';
import { ethers } from 'ethers';
import {
  Wallet,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [claimableWei, setClaimableWei] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [streamRateWei, setStreamRateWei] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState<boolean | null>(null);

  function getReadOnlyContract() {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
    return new ethers.Contract(contractAddress, [
      "function claimableAmount(address _employee) view returns (uint256)",
      "function streams(address _employee) view returns (uint256 ratePerSecond, uint256 lastWithdrawTime, uint256 accruedBalance, bool isActive)",
    ], provider);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      const loginUrl = (import.meta as any).env?.VITE_EMPLOYEE_LOGIN_URL || '/employee-login';
      window.location.href = loginUrl;
      return;
    }
    Promise.all([getMyProfile(), getMyTransactions(), getBlockchainConfig()])
      .then(([p, t, cfg]: [any, any, any]) => {
        setProfile(p);
        setTransactions(t || []);
        const addr = cfg?.contract_address || null;
        if (addr) setContractAddress(addr);

        if (addr) {
          reconnectIfLoggedIn(addr).then((reconnectedAddr) => {
            if (reconnectedAddr) {
              setWalletAddress(reconnectedAddr);
            } else if (p?.employee?.wallet_address) {
              setWalletAddress(p.employee.wallet_address);
            }
          });
        } else if (p?.employee?.wallet_address) {
          setWalletAddress(p.employee.wallet_address);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          typeof stream.isActive === 'boolean'
            ? stream.isActive
            : typeof stream[3] === 'boolean'
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
        alert('Wallet connected but failed to save to account: ' + (saveErr?.message || 'Unknown error'));
      }
      await loadClaimable(address);
    } catch (err: any) {
      alert(err?.message || 'Failed to connect wallet');
    }
  }

  async function handleWithdraw() {
    if (!contractAddress || !walletAddress) return;
    setWithdrawLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.withdraw();
      await tx.wait();
      await loadClaimable();
    } catch (err: any) {
      alert(err?.message || 'Withdraw failed');
    } finally {
      setWithdrawLoading(false);
    }
  }

  const totalEarned = profile?.total_earned ?? 0;
  const stats = useMemo(() => {
    const now = new Date();
    const monthlyIncome = transactions
      .filter((t) => {
        const d = new Date(t.timestamp);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + Number(t.amount), 0);
    return {
      totalBalance: totalEarned,
      monthlyIncome,
      monthlyExpenses: 0,
      nextPayrollDate: '30 March 2026',
      availableBalance: totalEarned,
    };
  }, [transactions, totalEarned]);

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
      transactions.slice(0, 5).map((t) => ({
        type: 'income' as const,
        title: t.description || 'Payment',
        amount: Number(t.amount),
        time: formatTimeAgo(t.timestamp),
      })),
    [transactions]
  );

  function formatTimeAgo(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/60 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white shadow-lg">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Employee Account</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{profile?.name || 'User'}</p>
              <p className="text-sm text-slate-600">{profile?.email || '--'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!walletAddress ? (
              <button
                onClick={handleConnectWallet}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
              >
                Link Wallet
              </button>
            ) : (
              <span className={`rounded-2xl px-4 py-3 text-sm font-medium ${streamActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {streamActive ? 'Stream Active' : 'Stream Paused'}
              </span>
            )}
            {!walletAddress && (typeof (window as any).ethereum !== 'undefined') && (
              <button
                onClick={() => ensureHeLaNetwork((window as any).ethereum)}
                className="rounded-2xl bg-cyan-600 px-5 py-3 text-white transition hover:bg-cyan-700"
              >
                Add HeLa Network
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Recorded Payouts</p>
            <p className="mt-2 text-xl font-semibold">{Number(totalEarned).toLocaleString()} HLUSD</p>
            <p className="mt-1 text-sm text-slate-300">Historical payout records stored by the backend.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Wallet State</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not linked yet'}
            </p>
            <p className="mt-1 text-sm text-slate-500">Saved wallet syncs with your payroll access.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Expected Review</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{stats.nextPayrollDate}</p>
            <p className="mt-1 text-sm text-slate-500">Reference checkpoint for treasury and payroll review.</p>
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
          value={`${stats.monthlyExpenses.toLocaleString()} HLUSD`}
          subtitle="Not used in current flow"
          iconBg="bg-rose-500"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          title="Next Payroll Date"
          value={stats.nextPayrollDate}
          iconBg="bg-slate-900"
        />
      </div>

      {contractAddress && (
        <section className="rounded-[30px] border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)]">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">On-Chain PayStream (HeLa Testnet)</h3>
          {!walletAddress ? (
            <button
              onClick={handleConnectWallet}
              className="rounded-2xl bg-cyan-600 px-6 py-3 text-white transition hover:bg-cyan-700"
            >
              Connect Wallet (Web3Auth)
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </p>
              <p className="text-lg font-semibold text-cyan-700">
                Claimable: {claimableWei ? `${ethers.formatEther(claimableWei)} HLUSD` : '0 HLUSD'}
              </p>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !claimableWei || claimableWei === '0'}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          )}

          {walletAddress && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                onClick={() => loadClaimable()}
                className="rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-sm transition hover:bg-slate-100"
              >
                Refresh Stream
              </button>
              <a
                href={
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                    ? `${(import.meta as any).env.VITE_HELA_EXPLORER_ADDRESS}${walletAddress}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl px-4 py-3 text-center ${(import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
              >
                View Wallet on HeLa
              </a>
              <a
                href={
                  (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS && contractAddress
                    ? `${(import.meta as any).env.VITE_HELA_EXPLORER_ADDRESS}${contractAddress}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl px-4 py-3 text-center ${(import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS
                  ? 'bg-slate-950 text-white hover:bg-slate-800'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
              >
                View Contract
              </a>
            </div>
          )}

          {walletAddress && streamRateInfo && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                <p className="mb-1 text-xs text-cyan-700">Live Stream Rate</p>
                <p className="text-sm font-semibold text-slate-900">
                  {streamRateInfo.perSecond.toFixed(6)} HLUSD/sec
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Approx {streamRateInfo.perMonth.toFixed(2)} HLUSD per 30 days
                </p>
                {streamActive === false && (
                  <p className="mt-1 text-xs text-rose-500">Stream is currently paused</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <TransactionGraph />

      <section className="rounded-[30px] border border-white/60 bg-white/92 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">Recorded Payout Timeline</h3>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((t, i) => {
            const amt = Number(t.amount) || 0;
            const maxAmt = Math.max(1, ...transactions.slice(0, 10).map((x: any) => Number(x.amount) || 0));
            const pct = Math.min(100, Math.round((amt / maxAmt) * 100));
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600">{new Date(t.timestamp).toLocaleDateString()}</div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-28 text-right text-sm font-medium text-slate-700">{amt.toLocaleString()} HLUSD</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/60 bg-white/92 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Recent Activity</h3>
          <button className="text-sm font-medium text-cyan-700 hover:text-cyan-800">View All</button>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${activity.type === 'income'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
                  }`}>
                  {activity.type === 'income' ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{activity.title}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
              <p className={`font-semibold ${activity.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {activity.type === 'income' ? '+' : '-'}{activity.amount.toLocaleString()} HLUSD
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'personal':
        return <PersonalSetup profile={profile} />;
      case 'transactions':
        return (
          <div className="space-y-6">
            <TransactionGraph transactions={transactions} />
            <TransactionHistory transactions={transactions} />
          </div>
        );
      case 'history':
        return <TransactionHistory transactions={transactions} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.28),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_38%,#155e75_100%)]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-[30px] border border-white/10 bg-white/6 px-6 py-5 backdrop-blur-xl">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'personal' && 'Profile'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'history' && 'Transaction History'}
            </h1>
            <p className="text-slate-200/90">
              {activeTab === 'overview' && 'Welcome back. Here is your financial overview in a cleaner workspace.'}
              {activeTab === 'personal' && 'Manage your personal information and preferences.'}
              {activeTab === 'transactions' && 'View and analyze your transactions.'}
              {activeTab === 'history' && 'Complete history of all your transactions.'}
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/6 px-6 py-8 text-slate-200">Loading...</div>
          ) : (
            renderContent()
          )}
        </div>
      </main>
    </div>
  );
}
