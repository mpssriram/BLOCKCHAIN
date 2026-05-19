import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Mail, UserRound, WalletCards } from "lucide-react";

const options = [
  {
    title: "Employer portal",
    description:
      "Treasury, payroll stream operations, employee management, and reporting for employer-side operators.",
    route: "/employer-login",
    icon: Building2,
    eyebrow: "Operations access",
  },
  {
    title: "Employee portal",
    description:
      "Recorded earnings, wallet details, payout history, and employee self-service access in one workspace.",
    route: "/employee-login",
    icon: UserRound,
    eyebrow: "Self-service access",
  },
];

export default function AuthChoice() {
  const navigate = useNavigate();

  return (
    <div className="premium-auth-shell relative min-h-screen overflow-hidden px-6 py-10 text-white">
      <div className="premium-grid absolute inset-0 opacity-40" />
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-[140px]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-surface rounded-[2rem] p-8 sm:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-cyan-100">
                <Mail className="h-4 w-4" />
                Portal access
              </div>
              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Choose the right PayStream workspace.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Employers and employees use separate entry points so role-scoped access, payroll
                operations, and self-service activity stay cleanly separated.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                  <WalletCards className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">PayStream</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                    Role-aware payroll access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.route}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(option.route)}
                className="premium-surface group rounded-[2rem] p-7 text-left transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.12)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-cyan-100 transition-transform group-hover:translate-x-1" />
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
                  {option.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{option.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{option.description}</p>

                <div className="mt-6 flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <span className="text-sm text-slate-300">
                    Continue with Google or company email
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950">
                    Open portal
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
