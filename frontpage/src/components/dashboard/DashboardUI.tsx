import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, LoaderCircle, LucideIcon } from "lucide-react";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-w-0"
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300/80">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      </motion.div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  eyebrow,
  description,
  children,
  actions,
  tone = "dark",
  className = "",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  const shell =
    tone === "dark"
      ? "border-white/10 bg-white/[0.04] text-white"
      : "border-slate-200 bg-white text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)]";
  const eyebrowColor = tone === "dark" ? "text-cyan-300/80" : "text-cyan-600";

  return (
    <section className={`rounded-xl border p-5 ${shell} ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className={`text-xs font-medium uppercase tracking-[0.16em] ${eyebrowColor}`}>{eyebrow}</p> : null}
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "cyan",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  accent?: "cyan" | "emerald" | "violet" | "amber" | "rose";
}) {
  const accentMap = {
    cyan: "text-cyan-300 bg-cyan-300/12",
    emerald: "text-emerald-300 bg-emerald-300/12",
    violet: "text-violet-300 bg-violet-300/12",
    amber: "text-amber-300 bg-amber-300/12",
    rose: "text-rose-300 bg-rose-300/12",
  } satisfies Record<string, string>;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentMap[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "active" | "paused" | "danger" | "warning" | "info";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/6 text-slate-300",
    active: "border-emerald-300/20 bg-emerald-300/12 text-emerald-200",
    paused: "border-amber-300/20 bg-amber-300/12 text-amber-200",
    danger: "border-rose-300/20 bg-rose-300/12 text-rose-200",
    warning: "border-amber-300/20 bg-amber-300/12 text-amber-200",
    info: "border-cyan-300/20 bg-cyan-300/12 text-cyan-200",
  } satisfies Record<string, string>;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const map = {
    primary: "bg-white text-slate-950 hover:bg-cyan-50",
    secondary: "border border-white/14 bg-white/10 text-white hover:bg-white/16",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
  } satisfies Record<string, string>;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${map[variant]}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-3 text-slate-300">
        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-rose-300/14 bg-rose-500/8 px-6 py-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 h-5 w-5 text-rose-300" />
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
