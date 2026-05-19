import { motion } from 'framer-motion';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChartColumnStacked,
  Fingerprint,
  Play,
  ShieldCheck,
  UserRoundCheck,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntrySectionIntro } from './EntrySection';

const cards = [
  {
    role: 'employer' as const,
    title: 'Employer Workspace',
    description: 'Manage the operational side of payroll infrastructure with treasury visibility, stream controls, reporting context, and employee records.',
    icon: BriefcaseBusiness,
    action: 'Employer Login',
    route: '/employer-login',
    bullets: [
      'Manage employees',
      'Start, pause, and cancel streams',
      'Track treasury and reports',
      'Review payroll activity',
    ],
    accent: 'from-emerald-300/30 via-cyan-300/15 to-transparent',
  },
  {
    role: 'employee' as const,
    title: 'Employee Wallet',
    description: 'Give employees a cleaner path into wallet-linked payroll visibility without exposing employer-only controls or back-office state.',
    icon: UserRoundCheck,
    action: 'Employee Portal',
    route: '/employee-login',
    bullets: [
      'Link wallet',
      'View claimable salary',
      'Withdraw earnings',
      'Track transaction history',
    ],
    accent: 'from-blue-300/25 via-cyan-300/10 to-transparent',
  },
];

export function LoginCards() {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="bg-[#eef4f7] px-4 py-24 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <EntrySectionIntro
            eyebrow="How it works"
            title="From treasury funding to employee withdrawal, the flow stays clear."
            description="PayStream separates contract state, application records, and wallet actions so employers and employees can understand what happens at each step."
          />

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Fingerprint className="h-4 w-4 text-[#22c9ba]" />
              State clarity
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Contract state governs stream accrual and withdrawals. Backend state governs identity, dashboards,
              reporting, notifications, and audit trails.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Employer creates a payroll stream',
              body: 'The employer portal initiates the payroll flow and records operational intent around the stream action.',
              icon: Play,
            },
            {
              step: '02',
              title: 'Contract tracks live salary accrual',
              body: 'The smart contract remains the source of truth for stream status, claimable salary, tax movement, and treasury effects.',
              icon: ChartColumnStacked,
            },
            {
              step: '03',
              title: 'Employee withdraws claimable salary',
              body: 'The employee portal connects the wallet flow, while the backend preserves supporting records and reporting context.',
              icon: Wallet,
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)]"
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-200/30 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.step}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div id="product" className="grid gap-6 lg:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.role}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group overflow-hidden rounded-[2.1rem] border border-slate-200 bg-[#08111d] text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
              >
                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-r ${card.accent}`} />
                <div className="relative p-7 sm:p-8">
                  <div className="relative flex flex-col gap-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                        {card.role === 'employer' ? 'Employer app' : 'Employee app'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-3xl font-semibold">{card.title}</h3>
                      <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">{card.description}</p>
                    </div>

                    <div className="grid gap-3">
                      {card.bullets.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                          <ShieldCheck className="h-4 w-4 text-cyan-300" />
                          <p className="text-sm text-slate-200">{item}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition group-hover:bg-cyan-50"
                      onClick={() => navigate(card.route)}
                    >
                      {card.action}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
