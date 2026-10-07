import React from 'react';

interface StatisticCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'blue',
}) => {
  const variantStyles = {
    blue: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      valColor: 'text-blue-950',
    },
    emerald: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valColor: 'text-emerald-950',
    },
    amber: {
      border: 'border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
      valColor: 'text-amber-950',
    },
    rose: {
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      valColor: 'text-rose-950',
    },
    purple: {
      border: 'border-purple-100',
      iconBg: 'bg-purple-50 text-purple-600',
      valColor: 'text-purple-950',
    },
    slate: {
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valColor: 'text-slate-900',
    },
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${variantStyles.border} bg-white p-5 shadow-xs hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`p-2.5 rounded-xl ${variantStyles.iconBg}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${variantStyles.valColor}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};
