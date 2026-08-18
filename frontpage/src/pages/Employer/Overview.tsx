import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleDollarSign,
  Landmark,
  ShieldCheck,
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
        title="Overview"
      />

      {loading ? <LoadingState label="Loading payroll dashboard..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={loadOverview} /> : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total payout"
              value={`Rs ${formatCurrency(totalPayout)}`}
              icon={CircleDollarSign}
              accent="cyan"
            />
            <StatCard
              label="Total tax"
              value={`Rs ${formatCurrency(totalTax)}`}
              icon={ShieldCheck}
              accent="emerald"
            />
            <StatCard
              label="Active streams"
              value={String(activeStreams)}
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
              title="Monthly payroll"
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

            <SectionCard title="Treasury health">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Available balance</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    Rs {formatCurrency(Number(treasurySummary?.treasury?.onchain_balance || 0))}
                  </p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="mt-2"><StatusBadge tone={healthTone}>{treasurySummary?.health?.status || "unknown"}</StatusBadge></div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <SectionCard
              title="Top earners"
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
              title="Activity"
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
                </div>

                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-slate-300">Recent transaction count</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{Number(treasurySummary?.recent_transactions || 0)}</p>
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
