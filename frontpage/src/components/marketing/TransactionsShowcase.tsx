import { motion } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  DatabaseZap,
  LockKeyhole,
  PanelsTopLeft,
  Wallet,
} from 'lucide-react';
import { EntrySectionIntro } from './EntrySection';

const pillars = [
  {
    title: 'Contract state',
    body: 'Live payroll stream state, claimable salary, withdrawals, and treasury or tax movement remain on-chain.',
    icon: Blocks,
  },
  {
    title: 'Backend records',
    body: 'Identity, metadata, dashboards, reports, notifications, and audit logs live in application state.',
    icon: DatabaseZap,
  },
  {
    title: 'Frontend actions',
    body: 'UI, wallet prompts, and API calls connect operators and employees to the correct flow without replacing source-of-truth systems.',
    icon: PanelsTopLeft,
  },
];

export function TransactionsShowcase() {
  return (
    <section id="security" className="bg-[#07111c] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <EntrySectionIntro
            eyebrow="Security and state clarity"
            title="A serious split between live contract state and operational records."
            description="The landing page should make trust boundaries obvious: the contract handles live payroll mechanics, the backend handles identity and records, and the frontend initiates user actions."
            tone="dark"
          >
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="glass-card rounded-[1.5rem] p-5">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <LockKeyhole className="h-4 w-4 text-cyan-300" />
                  Identity boundary
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  JWT and Firebase-backed access remain in the app layer even when payroll state is live on-chain.
                </p>
              </div>
              <div className="glass-card rounded-[1.5rem] p-5">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Wallet className="h-4 w-4 text-cyan-300" />
                  Wallet boundary
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Wallet prompts and transaction initiation happen in the frontend, but the chain remains the settlement authority.
                </p>
              </div>
            </div>
          </EntrySectionIntro>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="glass-panel rounded-[2rem] p-5"
          >
            <div className="rounded-[1.6rem] border border-white/10 bg-[#0b1421] p-5">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Architecture trust model</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Source-of-truth map</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">
                  Production readiness starts with state clarity
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {pillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5">
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <p className="mt-4 text-xl font-semibold text-white">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-[#08111d] p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
                  {[
                    'Intent created',
                    'Wallet action initiated',
                    'Contract state updated',
                    'Backend records reflected',
                  ].map((step, index, steps) => (
                    <div key={step} className="contents">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{step}</p>
                      </div>
                      {index < steps.length - 1 ? (
                        <div className="flex items-center justify-center text-cyan-300">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    'Reports are based on backend records unless chain-indexed separately.',
                    'Treasury summaries should not be assumed to equal live chain state unless explicitly synced.',
                    'Operational dashboards and audit logs belong to the backend even when payroll state is contract-driven.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
