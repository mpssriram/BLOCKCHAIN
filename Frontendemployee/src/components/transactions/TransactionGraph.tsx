import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ApiTransaction {
  timestamp: string;
  amount: string | number;
}

function buildMonthlyData(transactions: ApiTransaction[]) {
  const byMonth: Record<string, { income: number; expenses: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = { income: 0, expenses: 0 };
  }
  transactions.forEach((t) => {
    const d = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 };
    byMonth[key].income += Number(t.amount);
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => {
      const [y, m] = k.split('-');
      const monthLabel = monthNames[parseInt(m, 10) - 1];
      return { month: `${monthLabel} ${y}`, income: v.income, expenses: v.expenses, balance: v.income - v.expenses };
    });
}

export const TransactionGraph = React.memo(function TransactionGraph({ transactions = [] }: { transactions?: ApiTransaction[] }) {
  const data = useMemo(() => {
    const monthlyData = buildMonthlyData(transactions);
    if (monthlyData.length === 0) {
      return [{ month: 'No data', income: 0, expenses: 0, balance: 0 }];
    }
    return monthlyData;
  }, [transactions]);

  return (
    <div className="employee-panel rounded-[1.8rem] p-6">
      <h3 className="mb-2 text-xl font-semibold text-white">Recorded payout flow</h3>
      <p className="mb-6 text-sm leading-7 text-slate-400">
        Backend-recorded monthly activity across the most recent payout windows.
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.72} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
          <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#08111d',
              border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: '16px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Area type="monotone" dataKey="income" stroke="#22d3ee" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
          <Area type="monotone" dataKey="balance" stroke="#34d399" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
