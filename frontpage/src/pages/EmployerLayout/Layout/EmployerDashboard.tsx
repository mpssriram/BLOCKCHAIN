import { NavLink, Outlet } from "react-router-dom";
import { BadgeIndianRupee, BriefcaseBusiness, LayoutDashboard, Settings2, Sparkles, Users } from "lucide-react";

const EmployerDashboard = () => {
  const items = [
    { name: "Overview", path: "overview", icon: LayoutDashboard, description: "Payroll pulse" },
    { name: "Employees", path: "employees", icon: Users, description: "Team and streams" },
    { name: "Treasury", path: "treasury", icon: BadgeIndianRupee, description: "Funds and chain sync" },
    { name: "Bonuses", path: "bonuses", icon: Sparkles, description: "Rewards and payouts" },
    { name: "Settings", path: "settings", icon: Settings2, description: "Tax and rules" },
  ];

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#dbeafe_100%)]">

      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200/80 bg-white/75 p-6 backdrop-blur-2xl">
        <div className="mb-8 rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <BriefcaseBusiness className="h-6 w-6 text-cyan-300" />
          </div>
          <h2 className="text-2xl font-semibold">Employer Console</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Keep treasury, streams, employees, and bonuses aligned from one workspace.
          </p>
        </div>

        <nav className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.path}
              to={`/employer-dashboard/${item.path}`}
              className={({ isActive }) =>
                `block rounded-2xl border px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "border-slate-900 bg-slate-950 text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)]"
                    : "border-transparent bg-white/40 text-slate-700 hover:border-slate-200 hover:bg-white"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs">{item.description}</p>
                </div>
              </div>
            </NavLink>
          );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <header className="border-b border-slate-200/80 bg-white/70 px-8 py-6 backdrop-blur-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Dashboard
          </h1>
        </header>

        <main className="w-full max-w-7xl p-6 md:p-10">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default EmployerDashboard;

