import { motion } from 'motion/react';

const sections = [
  {
    title: 'HeLa Chain is designed for real-world adoption.',
    body: 'CorePayroll leans on that message by combining web-style employer operations with on-chain salary streaming, treasury visibility, and wallet-connected employee claims.',
  },
  {
    title: 'Modular architecture maps cleanly to payroll workflows.',
    body: 'Execution handles stream logic, consensus secures settlement, guardian-style trust improves operational confidence, and future AI-oriented flows can support payroll automation.',
  },
  {
    title: 'Stable-fee orientation makes salary streaming more practical.',
    body: 'That is the product story this frontend now tells more clearly through documentation-like content instead of generic SaaS marketing blocks.',
  },
];

const bullets = [
  'Employer dashboard for treasury, streams, and bonuses',
  'Employee portal for claimable balance and withdrawals',
  'Wallet configuration aligned with HeLa network endpoints',
  'Cleaner surfaces inspired by official docs and explorer UI',
];

export function Features() {
  return (
    <section className="border-t border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <p className="text-sm font-medium text-slate-500">Documentation-inspired overview</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A frontend that looks closer to HeLa docs than a generic startup template.
            </h2>
            <div className="mt-8 space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-2xl font-semibold text-slate-950">{section.title}</h3>
                  <p className="mt-3 text-lg leading-8 text-slate-600">{section.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-medium text-cyan-300">What this app focuses on</p>
            <ul className="mt-6 space-y-4">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-cyan-50 px-5 py-5 text-slate-900">
              <p className="text-sm font-medium text-cyan-700">Design note</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                The goal is not to clone the docs literally, but to borrow their clarity, spacing, and trust-building structure.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
