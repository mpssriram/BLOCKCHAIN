import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TowerLoader } from "../../components/ui/TowerLoader";
import {
  isDemoLoginEnabled,
  loginWithPassword,
  loginWithGoogle,
  redirectToEmployeePortal,
  requestPasswordReset,
} from "../../lib/auth";
import { isFirebaseConfigured } from "../../lib/firebase";

const trustPoints = [
  "Recorded earnings and payout history",
  "Wallet-linked payroll access",
  "Backend-authenticated employee session",
];

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("employee.portal.lastEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithPassword(email, password, "employee");
      if (rememberMe) {
        localStorage.setItem("employee.portal.lastEmail", email);
      } else {
        localStorage.removeItem("employee.portal.lastEmail");
      }
      await redirectToEmployeePortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle("employee");
      await redirectToEmployeePortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setLoading(true);

    try {
      await requestPasswordReset(email);
      sessionStorage.setItem("passwordResetEmail", email.trim());
      navigate("/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send password-reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!isDemoLoginEnabled()) {
      setError("Demo login is disabled.");
      return;
    }

    const demoEmail = (import.meta as any).env?.VITE_DEMO_EMPLOYEE_EMAIL || "";
    const demoPassword = (import.meta as any).env?.VITE_DEMO_EMPLOYEE_PASSWORD || "";

    if (!demoEmail || !demoPassword) {
      setError("Demo credentials not set");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await loginWithPassword(demoEmail, demoPassword, "employee");
      await redirectToEmployeePortal();
    } catch {
      setError("Demo login failed. Make sure the demo account exists in Firebase and the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="premium-auth-shell relative min-h-screen">
        <div className="premium-grid absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-20 h-72 w-72 rounded-full bg-cyan-400/12 blur-[120px]" />
          <div className="absolute right-[12%] top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-[110px]" />
        </div>

        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#07111f]/72 backdrop-blur-sm">
            <TowerLoader label="Signing you in..." />
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10"
        >
          <header className="flex items-center justify-between">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
              Back to PayStream
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Employee portal
            </div>
          </header>

          <div className="flex flex-1 items-center">
            <div className="grid w-full gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <section className="flex flex-col justify-center">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/75">
                    Payroll access
                  </p>
                  <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    Access your payroll workspace with clarity.
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                    Review recorded earnings, payout history, and wallet-linked salary activity in one secure employee portal.
                  </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {trustPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5 text-sm leading-7 text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8 inline-flex w-fit items-center gap-3 rounded-[1.4rem] border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                  <ShieldCheck className="h-4 w-4" />
                  Secure employee access with backend-issued session tokens
                </div>
              </section>

              <section className="flex items-center justify-center lg:justify-end">
                <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,24,0.94),rgba(8,14,24,0.82))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
                      Employee sign in
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">
                      Sign in to continue
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      Use Google for the fastest route, or sign in with your employee email and password.
                    </p>
                  </div>

                  {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-8 space-y-5">
                    {isFirebaseConfigured ? (
                      <>
                        <button
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white px-5 py-4 text-left text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div>
                            <p className="font-semibold">Continue with Google</p>
                            <p className="text-sm text-slate-500">Single-click access for verified employees</p>
                          </div>
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>
                        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.26em] text-slate-500">
                          <span className="h-px flex-1 bg-white/10" />
                          Or with email
                          <span className="h-px flex-1 bg-white/10" />
                        </div>
                      </>
                    ) : null}

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">Employee email address</span>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 focus-within:border-cyan-300/60">
                          <Mail className="h-5 w-5 text-slate-400" />
                          <input
                            type="email"
                            placeholder="employee@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="w-full border-0 bg-transparent p-0 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          Use the email assigned to your employee account for this portal.
                        </p>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 focus-within:border-cyan-300/60">
                          <LockKeyhole className="h-5 w-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full border-0 bg-transparent p-0 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="text-slate-400 transition hover:text-white"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-3 text-slate-300">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-300"
                        />
                        Remember my email
                      </label>

                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={loading}
                        className="text-left text-cyan-300 transition hover:text-cyan-200 sm:text-right"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <motion.button
                      whileHover={{ scale: loading ? 1 : 1.01 }}
                      whileTap={{ scale: loading ? 1 : 0.99 }}
                      onClick={handleLogin}
                      disabled={loading || !email || !password}
                      className="w-full rounded-2xl bg-[linear-gradient(135deg,#f0b85b_0%,#ffdf95_20%,#75f2d6_58%,#53b3ff_100%)] px-5 py-4 text-lg font-semibold text-slate-950 shadow-[0_18px_44px_rgba(83,179,255,0.24)] transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Preparing workspace..." : "Sign in securely"}
                    </motion.button>

                    {isDemoLoginEnabled() &&
                      (import.meta as any).env?.VITE_DEMO_EMPLOYEE_EMAIL &&
                      (import.meta as any).env?.VITE_DEMO_EMPLOYEE_PASSWORD ? (
                        <button
                          onClick={handleDemoLogin}
                          disabled={loading}
                          className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-semibold text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Use demo employee account
                        </button>
                      ) : null}
                  </div>

                  <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-400">
                    Need help? <span className="font-medium text-white">Contact payroll support</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
