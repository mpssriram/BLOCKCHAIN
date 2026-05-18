import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Pause, Ban, CircleOff, TrendingUp } from "lucide-react";
import { ethers } from "ethers";
import { getMyStream, type StreamDetails } from "../api";

const POLL_MS = 30_000;
const TICK_MS = 1_000;

function computeLiveWei(stream: StreamDetails): bigint {
  const base = BigInt(stream.claimable_wei || "0");
  if (stream.status !== "active") return base;

  const rate = BigInt(stream.rate_per_second_wei || "0");
  if (rate === 0n) return base;

  const now = Math.floor(Date.now() / 1000);
  const extra = rate * BigInt(Math.max(0, now - stream.fetched_at));
  return base + extra;
}

const statusConfig = {
  active: {
    label: "Streaming",
    icon: Activity,
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    className: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  },
  not_started: {
    label: "Not started",
    icon: CircleOff,
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
} as const;

type Props = {
  onStreamUpdate?: (stream: StreamDetails | null) => void;
  className?: string;
};

export function LiveSalaryCounter({ onStreamUpdate, className = "" }: Props) {
  const [stream, setStream] = useState<StreamDetails | null>(null);
  const [displayWei, setDisplayWei] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStream = useCallback(async () => {
    try {
      const data = await getMyStream();
      setStream(data);
      setDisplayWei(computeLiveWei(data));
      setError(null);
      onStreamUpdate?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load stream");
      onStreamUpdate?.(null);
    } finally {
      setLoading(false);
    }
  }, [onStreamUpdate]);

  useEffect(() => {
    fetchStream();
    const poll = window.setInterval(fetchStream, POLL_MS);
    return () => window.clearInterval(poll);
  }, [fetchStream]);

  useEffect(() => {
    if (!stream || stream.status !== "active") {
      if (stream) setDisplayWei(BigInt(stream.claimable_wei || "0"));
      return;
    }

    const tick = () => setDisplayWei(computeLiveWei(stream));
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [stream]);

  const formatted = useMemo(() => {
    try {
      return Number(ethers.formatEther(displayWei));
    } catch {
      return 0;
    }
  }, [displayWei]);

  const ratePerSecond = useMemo(() => {
    if (!stream) return 0;
    try {
      return Number(ethers.formatEther(stream.rate_per_second_wei || "0"));
    } catch {
      return 0;
    }
  }, [stream]);

  const status = stream?.status ?? "not_started";
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.not_started;
  const StatusIcon = cfg.icon;

  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-cyan-400/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-[0_24px_60px_rgba(8,145,178,0.18)] ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div className="relative">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Live salary
            </p>
          </motion.div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.className}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading stream from chain…</p>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : (
          <>
            <motion.p
              key={formatted.toFixed(6)}
              className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl"
              initial={{ opacity: 0.7, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {formatted.toFixed(6)}
              <span className="ml-2 text-lg font-semibold text-cyan-300">HLUSD</span>
            </motion.p>

            {status === "active" && ratePerSecond > 0 && (
              <p className="mt-2 text-sm text-slate-400">
                +{ratePerSecond.toFixed(8)} HLUSD/sec · updates every second
              </p>
            )}

            {status === "paused" && (
              <p className="mt-2 text-sm text-amber-200/80">
                Stream paused — balance frozen until HR resumes.
              </p>
            )}

            {status === "cancelled" && (
              <p className="mt-2 text-sm text-rose-200/80">
                Stream ended — you can still withdraw earned balance.
              </p>
            )}

            {status === "not_started" && (
              <p className="mt-2 text-sm text-slate-500">
                Link your wallet and ask HR to start your payroll stream.
              </p>
            )}

            {stream?.cached && (
              <p className="mt-3 text-xs text-slate-600">
                Chain data cached · refreshes every 30s
              </p>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchStream();
          }}
          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          Sync from chain
        </button>
      </motion.div>
    </section>
  );
}
