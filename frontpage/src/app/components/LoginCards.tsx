import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Landmark, LockKeyhole, UserRoundCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntrySectionIntro } from './EntrySection';

const cards = [
  {
    role: 'admin' as const,
    title: 'Employer Workspace',
    description: 'Control payroll streams, treasury deposits, employee wallets, bonuses, and tax settings from one operational dashboard.',
    icon: BriefcaseBusiness,
    action: 'Enter employer console',
    route: '/employer-login',
    highlights: [
      { label: 'Treasury', value: 'Fund and monitor' },
      { label: 'Streams', value: 'Start, pause, cancel' },
      { label: 'Compliance', value: 'Tax vault ready' },
    ],
    accent: 'bg-[#00c2a8]',
  },
  {
    role: 'employee' as const,
    title: 'Employee Wallet',
    description: 'See earned balance, connect your HeLa wallet, review salary history, and withdraw claimable payroll.',
    icon: UserRoundCheck,
    action: 'Open employee portal',
    route: '/employee-login',
    highlights: [
      { label: 'Balance', value: 'Live accrual' },
      { label: 'Wallet', value: 'Link and verify' },
      { label: 'Claims', value: 'Withdraw earned pay' },
    ],
    accent: 'bg-[#7c5cff]',
  },
];

export function LoginCards() {
  const navigate = useNavigate();

  return (
    <section id="login-panel" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <EntrySectionIntro
            eyebrow="Secure access"
            title="Two focused portals, one payroll engine."
            description="The entry page now sends each user directly into the workflow they need, with clearer role separation and stronger product context before login."
          />

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <LockKeyhole className="h-4 w-4 text-[#008f7c]" />
            JWT protected backend routes
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.role}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.16)]"
              >
                <div className="relative p-7 sm:p-8">
                  <div className="relative flex flex-col gap-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className={`rounded-full ${card.accent} px-4 py-2 text-sm font-semibold text-white`}>
                        {card.role === 'admin' ? 'Company side' : 'Employee side'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-3xl font-semibold">{card.title}</h3>
                      <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">{card.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {card.highlights.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                          <p className="text-xs uppercase text-slate-400">{item.label}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition group-hover:bg-cyan-50"
                      onClick={() => navigate('/auth')}
                    >
                      Go to auth
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Landmark, label: 'On-chain treasury', text: 'Deposits flow into the CorePayroll contract.' },
            { icon: Wallet, label: 'Wallet first', text: 'Employees claim earned payroll to connected wallets.' },
            { icon: LockKeyhole, label: 'Role aware', text: 'Employer and employee paths stay cleanly separated.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <Icon className="h-5 w-5 text-[#008f7c]" />
                <p className="mt-3 font-semibold text-slate-950">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
