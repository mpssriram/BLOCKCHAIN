import { motion } from 'motion/react';
import { ArrowUpRight, Blocks, Clock3, Search, Wallet } from 'lucide-react';

const endpointRows = [
  ['Network Name', 'HeLa Testnet'],
  ['RPC', 'https://testnet-rpc.helachain.com'],
  ['Chain ID', '666888'],
  ['Symbol', 'HLUSD'],
  ['Block Explorer', 'https://testnet-blockexplorer.helachain.com'],
];

const stats = [
  { label: 'Total blocks', value: '155,527', icon: Blocks },
  { label: 'Average block time', value: '443.6s', icon: Clock3 },
  { label: 'Wallet addresses', value: '54,708', icon: Wallet },
];

const latestTransactions = [
  { type: 'Token transfer', hash: '0x17...8888', status: 'Success', value: '0 HLUSD', fee: '0.28121 HLUSD' },
  { type: 'Contract call', hash: '0x2b...294e', status: 'Success', value: '0 HLUSD', fee: '0.15535 HLUSD' },
];

export function TransactionsShowcase() {
  return (
    <section id="network-endpoints" className="bg-[#fbfdff] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl"
        >
          <p className="text-sm font-medium text-slate-500">Introducing HeLa</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Network endpoints and explorer patterns your payroll app can actually use.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            This section mirrors the structure of official HeLa documentation: endpoint tables, explorer-style metrics,
            and a cleaner explanation of how the chain supports production-facing payroll flows.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
          >
            <h3 className="text-3xl font-semibold text-slate-950">Network Endpoints</h3>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Connect your frontend, wallet, and backend flows to HeLa using the same structure surfaced in the official network documentation.
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
              {endpointRows.map(([label, value], index) => (
                <div
                  key={label}
                  className={`grid grid-cols-[180px_1fr] gap-4 px-5 py-4 ${index !== endpointRows.length - 1 ? 'border-b border-slate-200' : ''}`}
                >
                  <p className="font-medium text-slate-600">{label}</p>
                  <p className="break-all text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-cyan-100 bg-[linear-gradient(180deg,#f4fdff_0%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(14,116,144,0.08)]"
          >
            <div className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-700">HeLa Chain Explorer</p>
                  <h3 className="mt-2 text-3xl font-semibold text-slate-950">Explorer-style preview</h3>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  Search by address / tx hash / block / token...
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-cyan-700">Latest blocks</div>
                  <div className="space-y-4 px-4 py-4 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900">#155527</p>
                      <p className="mt-1">Miner 0x0000...88888888</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">#155526</p>
                      <p className="mt-1">Stable fee and transaction throughput visible here.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-cyan-700">Latest transactions</div>
                  <div className="space-y-4 px-4 py-4">
                    {latestTransactions.map((tx) => (
                      <div key={tx.hash} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">{tx.type}</p>
                            <p className="mt-1 text-cyan-700">{tx.hash}</p>
                            <p className="mt-2 text-emerald-600">{tx.status}</p>
                          </div>
                          <div className="text-right text-slate-500">
                            <p>{tx.value}</p>
                            <p className="mt-1">Fee {tx.fee}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-cyan-700">
                <ArrowUpRight className="h-4 w-4" />
                Structured to feel like the official explorer, but focused on payroll operations.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
