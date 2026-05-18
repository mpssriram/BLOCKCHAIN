import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { isDemoLoginEnabled, loginWithFirebase, loginWithGoogle, redirectToEmployeePortal } from "../../app/auth";
import { TowerLoader } from "../../app/components/TowerLoader";

const featurePills = ["Live earnings", "Secure payroll", "Instant history"];

const workspaceHighlights = [
    {
        title: "What you can do here",
        items: ["Check payment history", "Review wallet details", "Track salary activity"],
    },
    {
        title: "Before you sign in",
        items: ["Use your company email", "Keep your password ready", "Use Google if your account is linked"],
    },
    {
        title: "Need help?",
        items: ["Contact payroll support", "Reset access with your admin", "Report account issues quickly"],
    },
];

export default function EmployeeLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            await loginWithFirebase(email, password, "employee");
            if (rememberMe) {
                localStorage.setItem("employee.portal.lastEmail", email);
            } else {
                localStorage.removeItem("employee.portal.lastEmail");
            }
            redirectToEmployeePortal();
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
            redirectToEmployeePortal();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
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
            await loginWithFirebase(demoEmail, demoPassword, "employee");
            redirectToEmployeePortal();
        } catch {
            setError("Demo login failed. Make sure the demo account exists in Firebase and the backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
            <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(18,247,214,0.18),_transparent_30%),radial-gradient(circle_at_85%_18%,_rgba(245,158,11,0.16),_transparent_22%),linear-gradient(135deg,#07111f_0%,#0d1b2f_38%,#132844_100%)] px-5 py-6 sm:px-6 lg:px-10 lg:py-10">
                <div className="pointer-events-none absolute inset-0 opacity-40">
                    <div className="absolute left-0 top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="absolute right-10 top-16 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]"
                >
                    {loading ? (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#07111f]/72 backdrop-blur-sm">
                            <TowerLoader label="Signing you in..." />
                        </div>
                    ) : null}

                    <section className="relative flex flex-col justify-between border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12 xl:p-14">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-cyan-100">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                KRACKHEADS employee workspace
                            </div>

                            <div className="mt-10 max-w-xl">
                                <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">Payroll access</p>
                                <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl xl:text-6xl">
                                    Sign in once. See exactly what payroll has recorded for you.
                                </h1>
                                <p className="mt-6 max-w-lg text-base leading-8 text-slate-300 sm:text-lg">
                                    This portal is for employees to review earnings, payout history, and wallet-linked
                                    salary activity without chasing updates manually.
                                </p>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {featurePills.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-slate-100"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-[28px] border border-white/10 bg-[#0a1628]/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <p className="text-sm uppercase tracking-[0.26em] text-cyan-200/70">Inside the portal</p>
                                <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                                    A useful login screen should explain the destination.
                                </h3>
                                <p className="mt-4 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                                    After sign-in, employees land in a workspace focused on earnings, recorded
                                    transactions, and account details tied to salary disbursement.
                                </p>

                                <div className="mt-8 space-y-4">
                                    {[
                                        "View current and previous payouts in one place.",
                                        "See recorded transactions without waiting on payroll email chains.",
                                        "Manage wallet details used for blockchain-linked payment flows.",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                                        >
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </span>
                                            <p className="text-sm leading-7 text-slate-300">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {workspaceHighlights.map((point) => (
                                    <div
                                        key={point.title}
                                        className="rounded-[24px] border border-white/10 bg-white/7 px-5 py-5"
                                    >
                                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{point.title}</p>
                                        <div className="mt-4 space-y-3">
                                            {point.items.map((item) => (
                                                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center p-4 sm:p-6 lg:p-8">
                        <div className="w-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,30,0.92),rgba(8,14,24,0.84))] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.45)] sm:p-8 lg:p-10">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/75">Employee sign in</p>
                                    <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                                        Access your payroll cockpit
                                    </h2>
                                    <p className="mt-4 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                                        Use Google for the fastest route, or sign in with your employee email and password.
                                    </p>
                                </div>

                                <div className="hidden rounded-2xl border border-white/10 bg-white/6 p-3 text-cyan-200 sm:block">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </div>

                            {error && (
                                <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
                                    {error}
                                </div>
                            )}

                            <div className="mt-8 space-y-5">
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white px-5 py-4 text-left text-slate-950 transition hover:translate-y-[-1px] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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

                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
                                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300/60 focus-within:bg-white/8">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                            <input
                                                type="email"
                                                placeholder="employee@test.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                className="w-full border-0 bg-transparent p-0 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
                                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300/60 focus-within:bg-white/8">
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
                                    className="w-full rounded-2xl bg-[linear-gradient(135deg,#f0b85b_0%,#ffdf95_18%,#75f2d6_55%,#53b3ff_100%)] px-5 py-4 text-lg font-semibold text-slate-950 shadow-[0_18px_44px_rgba(83,179,255,0.28)] transition hover:shadow-[0_22px_54px_rgba(83,179,255,0.38)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? "Preparing workspace..." : "Sign in securely"}
                                </motion.button>

                                {isDemoLoginEnabled() &&
                                    (import.meta as any).env?.VITE_DEMO_EMPLOYEE_EMAIL &&
                                    (import.meta as any).env?.VITE_DEMO_EMPLOYEE_PASSWORD && (
                                        <button
                                            onClick={handleDemoLogin}
                                            disabled={loading}
                                            className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-semibold text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Use demo employee account
                                        </button>
                                    )}
                            </div>

                            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-400">
                                Need help? <span className="font-medium text-white">Contact Support</span>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <span className="rounded-full border border-white/8 px-3 py-2">Pay stubs</span>
                                <span className="rounded-full border border-white/8 px-3 py-2">Earnings</span>
                                <span className="rounded-full border border-white/8 px-3 py-2">Transactions</span>
                            </div>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
