import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  Landmark,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getActiveStreams,
  getMonthlySummary,
  getTopEarners,
  getTotalPayout,
  getTotalTax,
  getTreasurySummary,
} from "../../lib/api";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageShell,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/dashboard/DashboardUI";

type TopEarner = { name: string; total_net: number };
type SummaryPoint = { month: string; total_paid_net: number; total_tax: number };
type TreasurySummary = {
  treasury?: { total_balance?: number; onchain_balance?: number };
  health?: { status?: string; total_rate?: number; is_low_treasury?: boolean; runway_sec?: number };
  total_recorded_payout?: number;
  total_tax_collected?: number;
  active_streams?: number;
  recent_transactions?: number;
};

const PIE_COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#a78bfa", "#fb7185"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function formatRunway(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds)) return "Runway not available";
  const days = seconds / 86400;
  if (days >= 1) return `${days.toFixed(1)} days of runway`;
  const hours = seconds / 3600;
  return `${hours.toFixed(1)} hours of runway`;
}

function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStreams, setActiveStreams] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<SummaryPoint[]>([]);
  const [treasurySummary, setTreasurySummary] = useState<TreasurySummary | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");
      const [activeData, payoutData, taxData, earnersData, monthlyData, treasuryData] = await Promise.all([
        getActiveStreams(),
        getTotalPayout(),
        getTotalTax(),
        getTopEarners(),
        getMonthlySummary(),
        getTreasurySummary(),
      ]);

      setActiveStreams(Number(activeData?.active_streams || 0));
      setTotalPayout(Number(payoutData?.total_paid_net || 0));
      setTotalTax(Number(taxData?.total_tax_collected || 0));
      setTopEarners(Array.isArray(earnersData) ? earnersData : []);
      setMonthlySummary(Array.isArray(monthlyData) ? monthlyData : []);
      setTreasurySummary(treasuryData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }

  const topEarnersPie = useMemo(
    () =>
      topEarners.map((item) => ({
        name: item.name,
        value: Number(item.total_net || 0),
      })),
    [topEarners]
  );

  const healthTone =
    treasurySummary?.health?.status === "safe"
      ? "active"
      : treasurySummary?.health?.status === "warning"
        ? "warning"
        : treasurySummary?.health?.status === "critical"
          ? "danger"
          : "neutral";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Overview"
        title="Executive payroll dashboard"
        description="A clear operating picture of payouts, tax movement, treasury readiness, and the split between contract-driven state and backend reporting."
      />

      {loading ? <LoadingState label="Loading payroll dashboard..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={loadOverview} /> : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total payout"
              value={`Rs ${formatCurrency(totalPayout)}`}
              detail="Backend-recorded cumulative net payouts."
              icon={CircleDollarSign}
              accent="cyan"
            />
            <StatCard
              label="Total tax"
              value={`Rs ${formatCurrency(totalTax)}`}
              detail="Backend-recorded tax collected across payroll actions."
              icon={ShieldCheck}
              accent="emerald"
            />
            <StatCard
              label="Active streams"
              value={String(activeStreams)}
              detail="Employees currently marked as receiving active payroll flows."
              icon={Activity}
              accent="violet"
            />
            <StatCard
              label="Treasury summary"
              value={`Rs ${formatCurrency(Number(treasurySummary?.treasury?.total_balance || 0))}`}
              detail={formatRunway(treasurySummary?.health?.runway_sec)}
              icon={Landmark}
              accent="amber"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              eyebrow="Monthly summary"
              title="Recorded payroll flow over time"
              description="This chart reflects backend summary data, not direct on-chain indexing."
            >
              {monthlySummary.length === 0 ? (
                <EmptyState
                  title="No monthly summary yet"
                  description="Monthly payroll summaries will appear here once backend transaction records accumulate."
                />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySummary}>
                      <defs>
                        <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#08111d",
                          border: "1px solid rgba(148,163,184,0.18)",
                          borderRadius: 16,
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total_paid_net"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#payoutFill)"
                        name="Net payout"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="System state"
              title="Source-of-truth clarity"
              description="Keep operational expectations aligned across contract state, backend records, and frontend wallet actions."
            >
              <div className="space-y-4">
                {[
                  {
                    title: "Contract = live payroll state",
                    body: "Smart-contract logic determines live stream status, claimable salary, withdrawals, and treasury/tax movement.",
                    icon: Wallet,
                  },
                  {
                    title: "Backend = records and reporting",
                    body: "Auth, dashboards, reports, notifications, and audit logs are maintained in application state.",
                    icon: BriefcaseBusiness,
                  },
                  {
                    title: "Frontend = action surface",
                    body: "This dashboard initiates wallet-connected actions and reads backend data without replacing source-of-truth systems.",
                    icon: ArrowUpRight,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                      className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-300">{item.body}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <SectionCard
              eyebrow="Top earners"
              title="Net payout distribution"
              description="A quick view of current top earners from backend payout records."
            >
              {topEarnersPie.length === 0 ? (
                <EmptyState
                  title="No top earners yet"
                  description="Once payout records exist, the highest-paid employees by net payout will appear here."
                />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={topEarnersPie} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92}>
                          {topEarnersPie.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#08111d",
                            border: "1px solid rgba(148,163,184,0.18)",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {topEarnersPie.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Net payout</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-cyan-200">Rs {formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Payroll activity"
              title="Treasury and reporting health"
              description="A concise summary of treasury health and backend-recorded activity volume."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-300">Treasury health</p>
                    <StatusBadge tone={healthTone}>
                      {treasurySummary?.health?.status || "unknown"}
                    </StatusBadge>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    Rs {formatCurrency(Number(treasurySummary?.treasury?.onchain_balance || 0))}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Backend summary of recorded on-chain treasury value and payroll readiness.
                  </p>
                </div>

                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-slate-300">Recent transaction count</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{Number(treasurySummary?.recent_transactions || 0)}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Number of backend-recorded transaction entries contributing to the reporting surface.
                  </p>
                </div>

                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5 md:col-span-2">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-cyan-300" />
                    <p className="font-semibold text-white">Operational notes</p>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                    <li>Reports and dashboard metrics are based on backend records unless a separate chain index exists.</li>
                    <li>Live payroll state still belongs to the contract even when the dashboard summarizes treasury or stream posture.</li>
                    <li>Use treasury sync and stream-specific views carefully when distinguishing backend state from chain state.</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

export default React.memo(Overview);
