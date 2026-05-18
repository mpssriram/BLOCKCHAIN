import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  RadioTower,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const streamRows = [
  { name: 'Maya Chen', role: 'Design Lead', amount: '1,284.20', status: 'Streaming' },
  { name: 'Arjun Rao', role: 'Smart Contract', amount: '2,048.85', status: 'Claimable' },
  { name: 'Iris Stone', role: 'Operations', amount: '764.10', status: 'Active' },
];

const signals = [
  { label: 'Treasury funded', value: '50,000 HLUSD', icon: CircleDollarSign },
  { label: 'Streams live', value: '18 employees', icon: RadioTower },
  { label: 'Settlement', value: 'HeLa Testnet', icon: ShieldCheck },
];

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#071118] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#071118_0%,#10262a_46%,#f6fbf7_100%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,#ffffff_100%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">PayStream</p>
              <p className="text-xs text-cyan-100/80">Payroll streaming on HeLa</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur md:flex">
            <BadgeCheck className="h-4 w-4 text-emerald-300" />
            Testnet ready
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 backdrop-blur">
              <Building2 className="h-4 w-4 text-cyan-200" />
              Employer treasury + employee payout rails
            </div>

            <h1 className="mt-7 text-5xl font-semibold leading-[1.04] text-white">
              Payroll that moves every second, not once a month.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100/82">
              PayStream turns salary into a live stream: employers fund the treasury, employees connect wallets,
              and earned HLUSD becomes visible as it accrues on-chain.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <motion.button
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-slate-950 shadow-[0_24px_60px_rgba(255,255,255,0.22)] transition hover:bg-cyan-50"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
              >
                Go to auth
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <a
                href="#network-endpoints"
                className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                View live flow
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {signals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-cyan-100">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{signal.label}</span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{signal.value}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-[2rem] border border-white/16 bg-slate-950/55 p-4 shadow-[0_34px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="rounded-[1.5rem] border border-white/12 bg-[#0b171d] p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm text-cyan-100/75">Streaming payroll console</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Treasury Command</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950">
                    Synced
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl bg-white p-5 text-slate-950">
                    <p className="text-sm text-slate-500">Available treasury</p>
                    <p className="mt-3 text-4xl font-semibold">50,000</p>
                    <p className="mt-1 text-sm font-medium text-emerald-600">HLUSD funded</p>
                    <div className="mt-6 h-2 rounded-full bg-slate-100">
                      <div className="h-2 w-[68%] rounded-full bg-[#00c2a8]" />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-100 p-3">
                        <p className="text-slate-500">Tax vault</p>
                        <p className="font-semibold">10%</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 p-3">
                        <p className="text-slate-500">Chain</p>
                        <p className="font-semibold">666888</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {streamRows.map((row, index) => (
                      <motion.div
                        key={row.name}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 + index * 0.08 }}
                        className="rounded-2xl border border-white/10 bg-white/8 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{row.name}</p>
                            <p className="mt-1 text-sm text-slate-300">{row.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-cyan-100">{row.amount}</p>
                            <p className="mt-1 text-xs text-emerald-300">{row.status}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
