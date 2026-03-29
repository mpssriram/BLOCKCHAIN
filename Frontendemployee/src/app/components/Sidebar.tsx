import { Home, User, CreditCard, History } from 'lucide-react';

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
    <aside className="w-72 min-h-screen border-r border-white/15 bg-slate-950/45 px-5 py-6 backdrop-blur-2xl">
      <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">Core Payroll</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Employee Hub</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Earnings, wallet status, and activity in one calm workspace.
        </p>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-50 to-white text-slate-900 shadow-[0_18px_40px_rgba(103,232,249,0.18)]'
                  : 'border-transparent bg-white/0 text-slate-200 hover:border-white/10 hover:bg-white/6'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2 ${
                    activeTab === item.id
                      ? 'bg-slate-900 text-cyan-300'
                      : 'bg-white/8 text-slate-300 group-hover:bg-white/12'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className={`text-xs ${activeTab === item.id ? 'text-slate-500' : 'text-slate-400'}`}>
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
