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
    <div className="employee-card rounded-[1.6rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p> : null}
        </div>
        <div className={`${iconBg} rounded-2xl p-3 text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
