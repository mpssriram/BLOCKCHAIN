import { motion } from 'framer-motion';
import { BanknoteArrowUp, Gauge, ShieldCheck, Workflow } from 'lucide-react';
import { EntrySectionIntro } from './EntrySection';

const features = [
  {
    title: 'Fund the treasury',
    body: 'Employers deposit HLUSD-style value into the payroll contract and keep a clear view of available runway.',
    icon: BanknoteArrowUp,
  },
  {
    title: 'Start salary streams',
    body: 'Each employee can be assigned a live rate, paused safely, or cancelled while preserving earned balance.',
    icon: Workflow,
  },
  {
    title: 'Claim earned payroll',
    body: 'Employees see claimable balance and withdraw through their connected wallet when funds are available.',
    icon: Gauge,
  },
  {
    title: 'Split tax automatically',
    body: 'The contract sends the configured tax share to the vault and the net amount to the employee.',
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <EntrySectionIntro
          eyebrow="How it works"
          title="Designed around the real payroll journey."
          description="The entry page now explains the product through the actions users recognize: fund, stream, claim, and reconcile."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-[#fbfcfa] p-6 transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff8ef] text-[#008f7c]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-12 rounded-[2rem] bg-slate-950 p-6 text-white md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-200">Entry page goal</p>
              <h3 className="mt-3 text-3xl font-semibold">Make the first screen feel alive.</h3>
              <p className="mt-4 text-base leading-8 text-slate-300">
                A visitor should understand the system before login: money enters the treasury, streams accrue,
                employees claim, and the chain records the activity.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Treasury funded', 'Stream accrues', 'Employee withdraws'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                  <p className="text-sm text-slate-400">Step {index + 1}</p>
                  <p className="mt-3 font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
