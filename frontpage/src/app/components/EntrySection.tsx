import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EntrySectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EntrySectionIntro({ eyebrow, title, description, children, className = '' }: EntrySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`max-w-3xl ${className}`}
    >
      <p className="text-sm font-semibold uppercase text-[#008f7c]">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>}
      {children}
    </motion.div>
  );
}

interface EntryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'light' | 'dark';
}

export function EntryButton({ children, onClick, variant = 'light' }: EntryButtonProps) {
  const classes =
    variant === 'dark'
      ? 'border border-white/15 bg-white/10 text-white hover:bg-white/16'
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
