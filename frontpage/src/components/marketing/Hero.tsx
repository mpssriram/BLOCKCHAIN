import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Landmark,
  LockKeyhole,
  Menu,
  RadioTower,
  ShieldCheck,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
];

const systemStrip = [
  {
    title: 'Smart-contract payroll',
    description: 'Live salary accrual, treasury movement, tax routing, and withdrawals stay anchored to contract state.',
    icon: RadioTower,
  },
  {
    title: 'JWT/Firebase auth',
    description: 'Identity, portal access, and role-aware routes stay in the backend and auth stack.',
    icon: LockKeyhole,
  },
  {
    title: 'Treasury tracking',
    description: 'Operators review treasury position, payroll activity, and backend-recorded reporting context.',
    icon: Landmark,
  },
  {
    title: 'Employee withdrawals',
    description: 'Employees connect wallets, review claimable earnings, and record withdrawal activity through the app.',
    icon: Wallet,
  },
];

export function Hero() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,201,185,0.14),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(70,136,255,0.16),transparent_26%),linear-gradient(180deg,#050816_0%,#081120_38%,#0b1423_100%)]" />
      <div className="landing-grid absolute inset-0 opacity-50" />
      <div className="absolute left-[-10%] top-12 h-72 w-72 rounded-full bg-cyan-400/12 blur-[110px]" />
      <div className="absolute right-[-6%] top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-24">
        <nav className="sticky top-4 z-30">
          <div className="glass-panel rounded-full px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                  <WalletCards className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-[0.08em] text-white">PayStream</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Payroll infrastructure</p>
                </div>
              </div>

              <div className="hidden items-center gap-7 lg:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-slate-300 transition hover:text-white"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/employer-login')}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
                >
                  Open Dashboard
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white lg:hidden"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {mobileOpen ? (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4 lg:hidden">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  type="button"
                  className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/auth');
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/employer-login');
                  }}
                >
                  Open Dashboard
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="grid items-center gap-12 pb-14 pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-4 py-2 text-sm font-medium text-cyan-50 backdrop-blur">
              <RadioTower className="h-4 w-4 text-cyan-300" />
              Wallet-connected payroll flows on HeLa
            </div>

            <h1 className="mt-8 text-balance text-5xl font-semibold leading-[0.98] text-white sm:text-6xl xl:text-7xl">
              Payroll that streams in real time.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PayStream helps employers start salary streams while employees track claimable earnings and
              withdrawals through wallet-connected payroll flows.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <motion.button
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-slate-950 shadow-[0_24px_60px_rgba(255,255,255,0.18)] transition hover:bg-cyan-50"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/employer-login')}
              >
                Employer Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <button
                type="button"
                onClick={() => navigate('/employee-login')}
                className="inline-flex items-center rounded-2xl border border-white/14 bg-white/[0.07] px-6 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/12"
              >
                Employee Portal
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Contract-driven live stream state
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <LockKeyhole className="h-4 w-4 text-cyan-300" />
                Backend identity and audit records
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative"
          >
            <div className="glass-panel relative overflow-hidden rounded-[2.25rem] p-4">
              <div className="absolute left-8 right-8 top-[7.5rem] h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />
              <motion.div
                className="absolute left-12 top-24 h-2 w-28 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-300 shadow-[0_0_28px_rgba(103,232,249,0.55)]"
                animate={{ x: ['0%', '160%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="rounded-[1.75rem] border border-white/10 bg-[#08111d] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Streaming payroll console</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Operational Snapshot</h2>
                  </div>
                  <div className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-4 py-2 text-sm font-semibold text-emerald-200">
                    Contract-connected
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.6rem] bg-white p-5 text-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Active Salary Stream</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">Live on contract</p>
                        </div>
                        <div className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Active
                        </div>
                      </div>
                      <div className="mt-5 h-2 rounded-full bg-slate-100">
                        <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500" />
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Claimable Balance</p>
                          <p className="mt-2 text-sm font-semibold text-slate-950">Employee-visible and wallet-ready</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recent Withdrawal</p>
                          <p className="mt-2 text-sm font-semibold text-slate-950">Recorded after employee confirmation</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="glass-card rounded-[1.45rem] p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Employer Treasury</p>
                        <p className="mt-3 text-lg font-semibold text-white">Funding source for stream operations</p>
                      </div>
                      <div className="glass-card rounded-[1.45rem] p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tax Vault</p>
                        <p className="mt-3 text-lg font-semibold text-white">Contract-routed tax movement on withdrawal</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: 'Stream Status',
                        body: 'Frontend reads current state while the contract remains the live accrual authority.',
                      },
                      {
                        title: 'Backend Record',
                        body: 'Auth, dashboards, reports, notifications, and audit logs remain in application state.',
                      },
                      {
                        title: 'Wallet Action',
                        body: 'Employees connect wallets and initiate claims through the portal when earnings are available.',
                      },
                    ].map((row, index) => (
                      <motion.div
                        key={row.title}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 + index * 0.08 }}
                        className="glass-card rounded-[1.45rem] p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                          <div>
                            <p className="font-semibold text-white">{row.title}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-300">{row.body}</p>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemStrip.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="glass-card rounded-[1.6rem] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
