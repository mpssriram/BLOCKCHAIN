import { motion } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  ClipboardList,
  Gauge,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntrySectionIntro } from './EntrySection';

const features = [
  {
    title: 'Real-time payroll streams',
    body: 'Stream status and claimable earnings stay aligned to the contract-driven payroll model.',
    icon: Gauge,
  },
  {
    title: 'Treasury overview',
    body: 'Operators keep a focused treasury view for payroll readiness, deposits, and operational review.',
    icon: Landmark,
  },
  {
    title: 'Transaction records',
    body: 'Backend transaction history supports reporting, auditability, and employee-facing history screens.',
    icon: ReceiptText,
  },
  {
    title: 'Tax-aware payouts',
    body: 'Tax movement is part of the payroll flow, with vault behavior reflected in the product story.',
    icon: ShieldCheck,
  },
  {
    title: 'Admin and action logs',
    body: 'Operational actions can be tracked alongside payroll workflows instead of disappearing into wallet history alone.',
    icon: ClipboardList,
  },
  {
    title: 'Notifications and reporting',
    body: 'Reporting and outbound notification capabilities stay in the backend application layer where teams expect them.',
    icon: BellRing,
  },
];

export function Features() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#edf3f6] px-4 py-24 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <EntrySectionIntro
          eyebrow="Features"
          title="Built like product infrastructure, not a decorative crypto homepage."
          description="The landing page now reflects the actual operating surface: payroll streams, treasury context, records, tax-aware movement, logs, and reporting."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff8ef] text-[#1fc7b5]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-14 rounded-[2.2rem] bg-[#08111d] p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.35)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Final CTA</p>
              <h3 className="mt-3 text-3xl font-semibold">Start from the right side of the payroll flow.</h3>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Employers step into the operational dashboard. Employees step into the wallet-connected payroll
                portal. The routing stays simple, but the product presentation now feels much more deliberate.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => navigate('/employer-login')}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-50"
              >
                Start as Employer
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/employee-login')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/16"
              >
                Open Employee Portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
