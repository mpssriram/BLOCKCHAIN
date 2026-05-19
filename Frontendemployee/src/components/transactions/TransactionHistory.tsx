import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  category: string;
}

interface ApiTransaction {
  id: number;
  amount: string | number;
  description: string;
  timestamp: string;
}

function toDisplay(api: ApiTransaction[]): Transaction[] {
  return api.map((t) => ({
    id: String(t.id),
    date: t.timestamp.split('T')[0],
    description: t.description || 'Payment',
    type: 'income' as const,
    amount: Number(t.amount),
    status: 'completed' as const,
    category: 'Salary',
  }));
}

export function TransactionHistory({ transactions: apiTransactions = [] }: { transactions?: ApiTransaction[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const transactions = useMemo(() => toDisplay(apiTransactions), [apiTransactions]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesSearch =
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || transaction.type === filterType;
        return matchesSearch && matchesFilter;
      }),
    [transactions, searchTerm, filterType]
  );

  const hasTransactions = transactions.length > 0;
  const hasFilteredResults = filteredTransactions.length > 0;

  return (
    <div className="employee-panel rounded-[1.8rem] p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Transaction history</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Recorded salary and payout rows stored by the backend for your employee account.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                filterType === 'income' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                filterType === 'expense' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>
      </div>

      {!hasTransactions ? (
        <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm leading-7 text-slate-300">
          No transactions have been recorded for this employee account yet.
        </div>
      ) : !hasFilteredResults ? (
        <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm leading-7 text-slate-300">
          No transactions match your current search or filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/6 transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${
                        transaction.type === 'income' ? 'bg-emerald-300/12 text-emerald-200' : 'bg-rose-300/12 text-rose-200'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm text-white">{transaction.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{transaction.category}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      transaction.type === 'income' ? 'bg-emerald-300/12 text-emerald-200' : 'bg-rose-300/12 text-rose-200'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`px-4 py-4 text-right text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-200' : 'text-rose-200'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}Rs {transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-emerald-300/12 text-emerald-200' :
                      transaction.status === 'pending' ? 'bg-amber-300/12 text-amber-200' :
                      'bg-rose-300/12 text-rose-200'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
