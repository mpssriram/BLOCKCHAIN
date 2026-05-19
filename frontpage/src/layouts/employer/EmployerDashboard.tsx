import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BadgeIndianRupee,
  BriefcaseBusiness,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton, StatusBadge } from "../../components/dashboard/DashboardUI";
import { getAuthRole, logout } from "../../lib/api";

const items = [
  { name: "Overview", path: "overview", icon: LayoutDashboard, description: "Executive payroll pulse" },
  { name: "Employees", path: "employees", icon: Users, description: "People and streams" },
  { name: "Treasury", path: "treasury", icon: BadgeIndianRupee, description: "Funds and sync state" },
  { name: "Bonuses", path: "bonuses", icon: Sparkles, description: "Additional payouts" },
  { name: "Settings", path: "settings", icon: Settings2, description: "Tax and operational rules" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Executive payroll dashboard" },
  employees: { title: "Employees", subtitle: "Employer-side employee operations" },
  treasury: { title: "Treasury", subtitle: "Treasury and wallet-connected funding console" },
  bonuses: { title: "Bonuses", subtitle: "Bonus allocation and payout prep" },
  settings: { title: "Settings", subtitle: "Tax controls and operational configuration" },
};

const EmployerDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authRole = getAuthRole();
  const networkLabel = (import.meta as any).env?.VITE_HELA_DISPLAY || "HeLa Testnet";

  const currentMeta = useMemo(() => {
    const segment = location.pathname.split("/").filter(Boolean).pop() || "overview";
    return pageTitles[segment] || pageTitles.overview;
  }, [location.pathname]);

  const SidebarNav = (
    <div className="flex h-full flex-col">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.12)]">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">PayStream</p>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Employer portal</p>
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/65 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
            Premium payroll operations
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Control treasury, employee records, stream actions, reporting context, and tax settings from one console.
          </p>
        </div>
      </div>

      <nav className="mt-6 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`/employer-dashboard/${item.path}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group block rounded-[1.5rem] border px-4 py-4 transition ${
                  isActive
                    ? "border-cyan-300/16 bg-cyan-300/10 text-white shadow-[0_18px_45px_rgba(34,211,238,0.08)]"
                    : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/12 hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/60">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-200" />
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          Logout
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.1),transparent_22%),linear-gradient(180deg,#050816_0%,#07101b_38%,#0b1421_100%)] text-white">
      <div className="landing-grid absolute inset-0 opacity-25" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[320px] border-r border-white/10 bg-[#07111d]/88 p-6 backdrop-blur-xl xl:block">
          {SidebarNav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111d]/82 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white xl:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Employer operations</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{currentMeta.title}</h1>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{currentMeta.subtitle}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="info">{networkLabel}</StatusBadge>
                <StatusBadge tone={authRole === "admin" ? "active" : "neutral"}>
                  {authRole ? `${authRole} account` : "signed in"}
                </StatusBadge>
                <ActionButton variant="secondary" onClick={logout}>
                  Logout
                  <LogOut className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          </header>

          <main className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
            <aside className="relative h-full w-[320px] max-w-[86vw] border-r border-white/10 bg-[#07111d] p-6 shadow-[0_32px_90px_rgba(2,6,23,0.5)]">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Navigation</p>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
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
