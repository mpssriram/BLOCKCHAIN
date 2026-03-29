import { motion } from 'framer-motion';
import { ArrowRight, Building2, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    role: 'admin' as const,
    title: 'Employer Portal',
    description: 'Manage team streams, treasury balances, on-chain actions, and compliance settings from a single console.',
    icon: Building2,
    bullets: ['Employee stream controls', 'Treasury and contract view', 'Bonus and tax operations'],
    accent: 'cyan',
  },
  {
    role: 'employee' as const,
    title: 'Employee Portal',
    description: 'Track earnings, link your wallet, monitor claimable balance, and withdraw accrued payroll.',
    icon: Users,
    bullets: ['Profile and transaction view', 'Wallet linking', 'Claimable stream tracking'],
    accent: 'blue',
  },
];

export function LoginCards() {
  const navigate = useNavigate();

  return (
    <section id="login-panel" className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-12 max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4 text-cyan-600" />
            Secure portal access
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Choose the workspace that matches your role.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Both portals follow the same HeLa-oriented design language, but each one focuses on the workflows that role actually needs.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const accentClasses =
              card.accent === 'cyan'
                ? 'from-cyan-50 to-white border-cyan-100 text-cyan-700'
                : 'from-blue-50 to-white border-blue-100 text-blue-700';

            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-[30px] border bg-gradient-to-br ${accentClasses} p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-5 inline-flex rounded-2xl bg-white p-3 shadow-sm">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-3xl font-semibold text-slate-950">{card.title}</h3>
                    <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">{card.description}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <div className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="mt-8 group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
                  onClick={() => navigate(card.role === 'admin' ? '/employer-login' : '/employee-login')}
                >
                  Open {card.title}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
