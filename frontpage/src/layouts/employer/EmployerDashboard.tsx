import { NavLink, Outlet } from "react-router-dom";
import {
  BadgeIndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../../components/dashboard/DashboardUI";
import { logout } from "../../lib/api";

const items = [
  { name: "Overview", path: "overview", icon: LayoutDashboard },
  { name: "Employees", path: "employees", icon: Users },
  { name: "Treasury", path: "treasury", icon: BadgeIndianRupee },
  { name: "Bonuses", path: "bonuses", icon: Sparkles },
  { name: "Settings", path: "settings", icon: Settings2 },
];

const EmployerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const networkLabel = (import.meta as any).env?.VITE_HELA_DISPLAY || "HeLa Testnet";

  const SidebarNav = (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.12)]">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">PayStream</p>
            <p className="text-xs text-slate-500">Employer portal</p>
          </div>
        </div>
      </div>

      <nav className="mt-5 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`/employer-dashboard/${item.path}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-300/10 text-white"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.05]">
                <Icon className="h-4 w-4" />
              </div>
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 pt-5">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          Logout
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07111d] text-white">
      <div className="landing-grid absolute inset-0 opacity-25" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-60 border-r border-white/10 bg-[#07111d] p-4 xl:block">
          {SidebarNav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#07111d]/95 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white xl:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <p className="text-sm font-semibold text-white xl:hidden">PayStream</p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge tone="info">{networkLabel}</StatusBadge>
                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  aria-label="Logout"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
          </header>

          <main className="relative w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            />
            <aside className="relative h-full w-64 max-w-[86vw] border-r border-white/10 bg-[#07111d] p-4 shadow-[0_32px_90px_rgba(2,6,23,0.5)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">PayStream</p>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {SidebarNav}
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmployerDashboard;
