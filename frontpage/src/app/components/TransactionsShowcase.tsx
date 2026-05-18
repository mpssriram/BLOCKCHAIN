import { motion } from 'framer-motion';
import { ArrowUpRight, Blocks, CheckCircle2, Clock3, ReceiptText, Search, Wallet } from 'lucide-react';
import { EntrySectionIntro } from './EntrySection';

const activity = [
  { type: 'Stream started', hash: '0x8a3...c91f', person: 'Maya Chen', value: '0.00042 HLUSD / sec' },
  { type: 'Withdrawal', hash: '0x44b...a20e', person: 'Arjun Rao', value: '1,080.45 HLUSD' },
  { type: 'Treasury deposit', hash: '0xf19...58aa', person: 'Employer vault', value: '10,000 HLUSD' },
];

const stats = [
  { label: 'Payroll actions', value: '284', icon: ReceiptText },
  { label: 'Wallets linked', value: '54', icon: Wallet },
  { label: 'Contract events', value: '1,529', icon: Blocks },
  { label: 'Average confirmation', value: 'Live', icon: Clock3 },
];

export function TransactionsShowcase() {
  return (
    <section id="network-endpoints" className="bg-[#f5f8f4] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <EntrySectionIntro
            eyebrow="Live payroll visibility"
            title="A front door that shows what the product actually does."
            description="Instead of abstract blockchain copy, the entry page now previews the payroll flow: stream events, wallet claims, treasury deposits, and the HeLa network details that power the app."
          >

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Network</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">HeLa Testnet</p>
                <p className="mt-2 text-sm text-slate-500">Chain ID 666888</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-sm text-cyan-100/80">Native asset</p>
                <p className="mt-2 text-xl font-semibold">HLUSD</p>
                <p className="mt-2 text-sm text-slate-300">Salary stream denomination</p>
              </div>
            </div>
          </EntrySectionIntro>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
          >
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#008f7c]">Payroll explorer</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">Recent contract activity</h3>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  Search wallet or tx hash
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <Icon className="h-4 w-4 text-[#008f7c]" />
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{stat.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {activity.map((item, index) => (
                  <div
                    key={item.hash}
                    className={`grid gap-4 px-5 py-4 md:grid-cols-[1fr_150px_170px] ${
                      index !== activity.length - 1 ? 'border-b border-slate-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-slate-950">{item.type}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.person}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#008f7c]">{item.hash}</p>
                    <p className="text-sm font-semibold text-slate-700 md:text-right">{item.value}</p>
                  </div>
                ))}
              </div>

              <a
                href="https://testnet-blockexplorer.helachain.com"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#008f7c]"
              >
                Open HeLa explorer
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
