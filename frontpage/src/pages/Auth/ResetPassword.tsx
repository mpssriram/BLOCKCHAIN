import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, MailCheck } from "lucide-react";
import { confirmPasswordReset, requestPasswordReset, verifyPasswordResetOtp } from "../../lib/api";

export default function ResetPassword() {
  const [email, setEmail] = useState(() => sessionStorage.getItem("passwordResetEmail") || "");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"code" | "verify" | "password" | null>(null);

  const handleSendCode = async () => {
    setError("");
    setMessage("");
    setResetToken("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setLoading("code");
    try {
      await requestPasswordReset(email.trim());
      sessionStorage.setItem("passwordResetEmail", email.trim());
      setMessage("If this account exists, a six-digit verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send a verification code.");
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || !/^\d{6}$/.test(otp)) {
      setError("Enter your email and the six-digit verification code.");
      return;
    }

    setLoading("verify");
    try {
      const result = await verifyPasswordResetOtp(email.trim(), otp);
      setResetToken(result.reset_token);
      setMessage("Code verified. You can now choose a new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the code.");
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading("password");
    try {
      const result = await confirmPasswordReset(resetToken, password);
      setMessage(result.message || "Password updated. You can now sign in.");
      setPassword("");
      setConfirmation("");
      sessionStorage.removeItem("passwordResetEmail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="premium-auth-shell flex min-h-screen items-center justify-center px-5 py-10 text-white">
      <section className="premium-surface w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
          {resetToken ? <LockKeyhole className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">PayStream access</p>
        <h1 className="mt-3 text-3xl font-semibold">{resetToken ? "Choose a new password" : "Verify your email"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {resetToken ? "Your code has been verified." : "Enter the six-digit code sent to your email."}
        </p>

        {error ? <p className="mt-6 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
        {message ? <p className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

        {!resetToken ? (
          <form className="mt-7 space-y-4" onSubmit={handleVerifyCode}>
            <label className="block text-sm font-medium text-slate-200">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading === "verify"}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none focus:border-cyan-300/60 disabled:opacity-50"
              />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Verification code
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                disabled={loading === "verify"}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 font-mono tracking-[0.3em] text-white outline-none focus:border-cyan-300/60 disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              disabled={loading !== null}
              className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "verify" ? "Verifying..." : "Verify code"}
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading !== null}
              className="w-full text-sm font-medium text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "code" ? "Sending code..." : "Send a new code"}
            </button>
          </form>
        ) : (
          <form className="mt-7 space-y-4" onSubmit={handlePasswordUpdate}>
            <label className="block text-sm font-medium text-slate-200">
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading === "password"}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none focus:border-cyan-300/60 disabled:opacity-50"
              />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Confirm new password
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={loading === "password"}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none focus:border-cyan-300/60 disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              disabled={loading !== null || message.includes("Password updated")}
              className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "password" ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link className="text-cyan-300 hover:text-cyan-200" to="/employer-login">Employer login</Link>
          <Link className="text-cyan-300 hover:text-cyan-200" to="/employee-login">Employee login</Link>
        </div>
      </section>
    </main>
  );
}
