import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { isDemoLoginEnabled, loginWithFirebase, loginWithGoogle } from "../../app/auth";
import { TowerLoader } from "../../app/components/TowerLoader";

const highlights = [
  {
    icon: Wallet,
    title: "Treasury control",
    desc: "Fund payroll streams and monitor HLUSD balances in one place.",
  },
  {
    icon: Users,
    title: "Workforce ops",
    desc: "Onboard employees, link wallets, and manage live payout streams.",
  },
  {
    icon: Shield,
    title: "Role-locked access",
    desc: "Employer tokens stay scoped to the Chief dashboard only.",
  },
];

const streamPreview = [
  { name: "Maya Chen", status: "Streaming", amount: "1,284 HLUSD" },
  { name: "Arjun Rao", status: "Claimable", amount: "2,048 HLUSD" },
  { name: "Iris Stone", status: "Active", amount: "764 HLUSD" },
];

export default function EmployerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const hasDemo =
    isDemoLoginEnabled() &&
    !!(import.meta as any).env?.VITE_DEMO_EMPLOYER_EMAIL &&
    !!(import.meta as any).env?.VITE_DEMO_EMPLOYER_PASSWORD;

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithFirebase(email, password, "employer");
      navigate("/employer-dashboard/overview");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Email sign-in failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle("employer");
      navigate("/employer-dashboard/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!isDemoLoginEnabled()) {
      setError("Demo login is disabled.");
      return;
    }

    const demoEmail = (import.meta as any).env?.VITE_DEMO_EMPLOYER_EMAIL || "";
    const demoPassword = (import.meta as any).env?.VITE_DEMO_EMPLOYER_PASSWORD || "";
    if (!demoEmail || !demoPassword) {
      setError("Demo credentials not set.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await loginWithFirebase(demoEmail, demoPassword, "employer");
      navigate("/employer-dashboard/overview");
    } catch {
      setError("Demo login failed. Ensure the demo account exists in Firebase and the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-[#050b10] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ambient background */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-0 h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[110px]"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-[100px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px]"
        animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050b10]/70 backdrop-blur-sm">
            <TowerLoader label="Opening employer dashboard..." />
          </div>
        ) : null}

        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            Back to PayStream
          </Link>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-sm font-semibold tracking-wide text-white">Chief</p>
              <p className="text-xs text-slate-500">Employer command center</p>
            </motion.div>
          </motion.div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16 xl:gap-24">
          {/* Login card */}
          <motion.div
            className="w-full max-w-[440px] shrink-0"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
              <div className="mb-8">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Employer portal
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back,
                  <span className="mt-1 block bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-200 bg-clip-text text-transparent">
                    Chief.
                  </span>
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Sign in to manage treasury, payroll streams, and your team on HeLa testnet.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-5 overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold text-slate-800 shadow-sm">
                    G
                  </span>
                  Continue with Google
                </button>

                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    or email
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </motion.div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Work email
                    </span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="employer@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Password
                    </span>
                    <motion.div className="relative" layout>
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        onKeyDown={(e) => e.key === "Enter" && email && password && handleLogin()}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </motion.div>
                  </label>
                </div>

                <motion.button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-4 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(16,185,129,0.35)] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Preparing dashboard..." : "Enter dashboard"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>

                {hasDemo && (
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 py-3.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-50"
                  >
                    Try demo account
                  </button>
                )}
              </div>

              <p className="mt-8 text-center text-xs text-slate-500">
                Not an employer?{" "}
                <Link to="/employee-login" className="font-medium text-emerald-400 hover:text-emerald-300">
                  Employee portal →
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Right panel — desktop */}
          <motion.div
            className="hidden w-full max-w-lg flex-col lg:flex"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold tracking-tight">
                Run payroll like a live feed.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Chief gives you treasury visibility, stream controls, and HeLa-native settlement —
                built for operators who need clarity, not clutter.
              </p>

              <div className="mt-8 space-y-3">
                {highlights.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                  >
                    <motion.div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-emerald-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#071118]/80">
                <motion.div
                  className="border-b border-white/10 px-4 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                    Live streams preview
                  </p>
                </motion.div>
                <div className="divide-y divide-white/5">
                  {streamPreview.map((row, i) => (
                    <motion.div
                      key={row.name}
                      className="flex items-center justify-between px-4 py-3.5"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.07 }}
                    >
                      <motion.div
                        animate={{ opacity: [0.85, 1, 0.85] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                      >
                        <p className="text-sm font-medium text-white">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.status}</p>
                      </motion.div>
                      <span className="text-sm font-semibold text-emerald-300">{row.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-600">
              Secured with Firebase Auth · Role-scoped backend tokens
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
