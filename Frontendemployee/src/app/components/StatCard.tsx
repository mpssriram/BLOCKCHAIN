import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  iconBg?: string;
}

export function StatCard({ icon, title, value, subtitle, iconBg = 'bg-blue-400' }: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/92 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
        <div className={`${iconBg} rounded-2xl p-3 text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
