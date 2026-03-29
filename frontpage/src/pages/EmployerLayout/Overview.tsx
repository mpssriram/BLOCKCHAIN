import { motion } from "framer-motion";
import { Users, Wallet, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import React, { useEffect, useState } from "react";
import { getActiveStreams, getTotalPayout, getTopEarners } from "../../app/api";

const COLORS = [
  "#2563eb",
  "#14b8a6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
];

function Overview() {
  const [activeStreams, setActiveStreams] = useState(0);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [topEarners, setTopEarners] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [activeData, payoutData, earnersData] = await Promise.all([
        getActiveStreams(),
        getTotalPayout(),
        getTopEarners(),
      ]);
      setActiveStreams(activeData.active_streams || 0);
      setTotalPayroll(Number(payoutData.total_paid_net || 0));
      setTopEarners(
        earnersData.map((e: any) => ({
          name: e.name,
          value: Number(e.total_net || 0),
        }))
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      <div className="mb-8 rounded-[30px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Payroll command center</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Track active salary flows, monitor cumulative payouts, and quickly spot your highest-paid team members.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-[28px] border border-blue-100 bg-white/85 p-6 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-md">
          <Users className="mb-3 h-6 w-6 text-blue-500" />
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Active Streams</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{activeStreams}</h2>
          <p className="mt-2 text-sm text-slate-500">Employees currently marked as receiving active payroll flow.</p>
        </div>

        <div className="rounded-[28px] border border-emerald-100 bg-white/85 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)] backdrop-blur-md">
          <Wallet className="mb-3 h-6 w-6 text-emerald-500" />
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Total Net Payout</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Rs {totalPayroll.toLocaleString()}</h2>
          <p className="mt-2 text-sm text-slate-500">Cumulative salary paid after tax deductions.</p>
        </div>

        <div className="rounded-[28px] border border-orange-100 bg-white/85 p-6 shadow-[0_18px_45px_rgba(249,115,22,0.08)] backdrop-blur-md">
          <Calendar className="mb-3 h-6 w-6 text-orange-500" />
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Next Payroll Date</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">30 March 2026</h2>
          <p className="mt-2 text-sm text-slate-500">Use this as the next review point for treasury readiness.</p>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Distribution</p>
            <h3 className="text-xl font-semibold text-slate-900">Top Earners</h3>
          </div>
          <p className="text-sm text-slate-500">Quick view of who is receiving the largest net payouts.</p>
        </div>

        {topEarners.length === 0 ? (
          <p className="text-slate-500">No payout data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={topEarners}
                dataKey="value"
                nameKey="name"
                outerRadius={115}
                innerRadius={68}
              >
                {topEarners.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(Overview);
