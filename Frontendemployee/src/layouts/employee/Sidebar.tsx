import { CreditCard, History, Home, User, WalletCards } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'personal', label: 'Profile', icon: User },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <aside className="w-full xl:w-80 xl:min-h-screen xl:border-r xl:border-white/10 xl:bg-[#06111d]/78 xl:px-5 xl:py-6 xl:backdrop-blur-2xl">
      <div className="employee-panel mb-6 rounded-[1.9rem] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.1)]">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">PayStream</p>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Employee workspace</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-slate-100">Recorded earnings and wallet-linked access</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Review payout records, connect your wallet, and check contract-related payroll status from one product surface.
          </p>
        </div>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'border-cyan-300/18 bg-cyan-300/10 text-white shadow-[0_18px_40px_rgba(103,232,249,0.08)]'
                  : 'border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/12 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2 ${
                    activeTab === item.id
                      ? 'bg-slate-950/80 text-cyan-300'
                      : 'bg-white/8 text-slate-300 group-hover:bg-white/12'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className={`text-xs leading-6 ${activeTab === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.id === 'overview' && 'Live balance and payroll summary'}
                    {item.id === 'personal' && 'Profile details from your account'}
                    {item.id === 'transactions' && 'Recent inflows and charts'}
                    {item.id === 'history' && 'Search past salary records'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
