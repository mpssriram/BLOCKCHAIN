import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EntrySectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}

export function EntrySectionIntro({
  eyebrow,
  title,
  description,
  children,
  className = '',
  tone = 'light',
}: EntrySectionProps) {
  const eyebrowClass = tone === 'dark' ? 'text-cyan-300/80' : 'text-[#39d0bf]';
  const titleClass = tone === 'dark' ? 'text-white' : 'text-slate-950';
  const descriptionClass = tone === 'dark' ? 'text-slate-300' : 'text-slate-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`max-w-3xl ${className}`}
    >
      <p className={`text-sm font-semibold uppercase tracking-[0.26em] ${eyebrowClass}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-4xl font-semibold leading-tight sm:text-5xl ${titleClass}`}>{title}</h2>
      {description && <p className={`mt-4 text-lg leading-8 ${descriptionClass}`}>{description}</p>}
      {children}
    </motion.div>
  );
}

interface EntryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'light' | 'dark' | 'ghost';
}

export function EntryButton({ children, onClick, variant = 'light' }: EntryButtonProps) {
  const classes =
    variant === 'dark'
      ? 'border border-white/15 bg-white/10 text-white hover:bg-white/16'
      : variant === 'ghost'
        ? 'border border-white/10 bg-slate-950/70 text-white hover:bg-slate-900'
        : 'bg-white text-slate-950 hover:bg-cyan-50';

  return (
    <button
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${classes}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
