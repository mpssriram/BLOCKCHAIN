import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { TransactionGraph } from './components/TransactionGraph';
import { TransactionHistory } from './components/TransactionHistory';
import { PersonalSetup } from './components/PersonalSetup';
import { YieldFeatures } from './components/YieldFeatures';
import { getMyProfile, getMyTransactions, getBlockchainConfig } from './api';
import { loginAndConnectContract, connectWalletOnly, isConnected, getConnectedAddress } from '../blockchain/web3Auth';
import { ethers } from 'ethers';
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Activity, 
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/employee-login';
      return;
    }
    Promise.all([getMyProfile(), getMyTransactions(), getBlockchainConfig()])
      .then(([p, t, cfg]: [any, any, any]) => {
        setProfile(p);
        setTransactions(t || []);
        const addr = (cfg?.contract_address || '').trim();
        const zeroAddr = '0x0000000000000000000000000000000000000000';
        if (addr && addr.toLowerCase() !== zeroAddr.toLowerCase()) setContractAddress(addr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (isConnected()) {
      getConnectedAddress().then((addr) => setWalletAddress(addr));
    }
  }, []);

  useEffect(() => {
    if (walletAddress && contractAddress) {
      loginAndConnectContract(contractAddress)
        .then(({ contract }) => contract.claimableAmount(walletAddress))
        .then((amt) => setClaimableWei(amt.toString()))
        .catch(() => setClaimableWei(null));
    }
  }, [walletAddress, contractAddress]);

  async function loadClaimable() {
    if (!contractAddress || !walletAddress) return;
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const amount = await contract.claimableAmount(walletAddress);
      setClaimableWei(amount.toString());
    } catch {
      setClaimableWei(null);
    }
  }

  async function handleConnectWallet() {
    const expectedWallet = (profile?.employee?.wallet_address || '').trim().toLowerCase();
    try {
      let address: string;
      if (contractAddress) {
        const { address: addr, contract } = await loginAndConnectContract(contractAddress);
        address = addr;
        const connected = address.toLowerCase();
        if (expectedWallet && connected !== expectedWallet) {
          alert(
            'Wallet mismatch. Please connect the wallet that HR linked to your profile, or ask HR to link this wallet: ' +
              address.slice(0, 10) + '...' + address.slice(-8)
          );
          return;
        }
        const amount = await contract.claimableAmount(address);
        setClaimableWei(amount.toString());
      } else {
        // No contract configured: still open Web3Auth login modal so user can connect wallet
        address = await connectWalletOnly();
        const connected = address.toLowerCase();
        if (expectedWallet && connected !== expectedWallet) {
          alert(
            'Wallet mismatch. Please connect the wallet that HR linked to your profile, or ask HR to link this wallet: ' +
              address.slice(0, 10) + '...' + address.slice(-8)
          );
          return;
        }
      }
      setWalletAddress(address);
    } catch (err: any) {
      alert(err?.message || 'Failed to connect wallet');
    }
  }

  async function handleWithdraw() {
    if (!contractAddress || !walletAddress) return;
    setWithdrawLoading(true);
    try {
      const { contract, signer } = await loginAndConnectContract(contractAddress);
      const tx = await contract.withdraw();
      await tx.wait();
      setClaimableWei('0');
    } catch (err: any) {
      alert(err?.message || 'Withdraw failed');
    } finally {
      setWithdrawLoading(false);
    }
  }

  const totalEarned = profile?.total_earned ?? 0;
  const stats = {
    totalBalance: totalEarned,
    monthlyIncome: transactions
      .filter((t) => {
        const d = new Date(t.timestamp);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + Number(t.amount), 0),
    monthlyExpenses: 0,
    nextPayrollDate: '30 March 2026',
    conversionAmount: (totalEarned / 83).toFixed(2),
    availableBalance: totalEarned,
  };

  const recentActivities = transactions.slice(0, 5).map((t) => ({
    type: 'income' as const,
    title: t.description || 'Payment',
    amount: Number(t.amount),
    time: formatTimeAgo(t.timestamp),
  }));

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Wallet className="w-6 h-6" />}
                title="Total Available Balance"
                value={`₹${stats.availableBalance.toLocaleString()}`}
                subtitle="Current balance"
                iconBg="bg-purple-500"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Monthly Income"
                value={`₹${stats.monthlyIncome.toLocaleString()}`}
                subtitle="+15% from last month"
                iconBg="bg-green-500"
              />
              <StatCard
                icon={<CreditCard className="w-6 h-6" />}
                title="Monthly Expenses"
                value={`₹${stats.monthlyExpenses.toLocaleString()}`}
                subtitle="-8% from last month"
                iconBg="bg-pink-500"
              />
              <StatCard
                icon={<Calendar className="w-6 h-6" />}
                title="Next Payroll Date"
                value={stats.nextPayrollDate}
                iconBg="bg-cyan-500"
              />
            </div>

            {/* On-Chain Withdraw (Web3Auth + HeLa) */}
            {contractAddress && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">On-Chain Earnings (HeLa Testnet)</h3>
                {!walletAddress ? (
                  <button
                    onClick={handleConnectWallet}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Connect Wallet (Web3Auth)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </p>
                    <p className="text-lg font-semibold text-indigo-600">
                      Claimable: {claimableWei ? `${ethers.formatEther(claimableWei)} HLUSD` : '0 HLUSD'}
                    </p>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawLoading || !claimableWei || claimableWei === '0'}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Conversion Amount Card */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-2">Conversion Amount (USD)</p>
                  <p className="text-4xl font-bold mb-1">${stats.conversionAmount.toLocaleString()}</p>
                  <p className="text-white/80 text-sm">≈ ₹{stats.totalBalance.toLocaleString()} INR</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Transaction Graph */}
            <TransactionGraph />

            {/* Recent Activity */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        activity.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {activity.type === 'income' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{activity.title}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      activity.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type === 'income' ? '+' : '-'}₹{activity.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'personal':
        return <PersonalSetup />;

      case 'transactions':
        return (
          <div className="space-y-6">
            <TransactionGraph transactions={transactions} />
            <TransactionHistory transactions={transactions} />
          </div>
        );

      case 'history':
        return <TransactionHistory transactions={transactions} />;

      case 'yield':
        return <YieldFeatures />;

      case 'settings':
        return (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Notifications
                </label>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Receive transaction alerts</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Two-Factor Authentication
                </label>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Enable 2FA
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Password
                </label>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'personal' && 'Personal Setup'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'history' && 'Transaction History'}
              {activeTab === 'yield' && 'Yield & Investments'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="text-white/80">
              {activeTab === 'overview' && 'Welcome back! Here\'s your financial overview.'}
              {activeTab === 'personal' && 'Manage your personal information and preferences.'}
              {activeTab === 'transactions' && 'View and analyze your transactions.'}
              {activeTab === 'history' && 'Complete history of all your transactions.'}
              {activeTab === 'yield' && 'Manage your yield accounts and investments.'}
              {activeTab === 'settings' && 'Configure your account settings.'}
            </p>
          </div>

          {loading ? (
            <div className="text-white/80">Loading...</div>
          ) : (
          renderContent()
          )}
        </div>
      </main>
    </div>
  );
}
