import React from 'react';
import { TokenStatus, PriorityLevel } from '../types';

interface StatusBadgeProps {
  status?: TokenStatus | PriorityLevel | 'ACTIVE' | 'IDLE' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'WAITING', size = 'md' }) => {
  const norm = String(status).toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (norm === 'WAITING' || norm === 'PENDING') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (norm === 'SERVING' || norm === 'IN_PROGRESS' || norm === 'ACTIVE') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-600 animate-ping';
  } else if (norm === 'SERVED' || norm === 'COMPLETED' || norm === 'SUCCESS') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (norm === 'SKIPPED') {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
    dotColor = 'bg-purple-600';
  } else if (norm === 'CANCELLED' || norm === 'ERROR' || norm === 'FAILED') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-600';
  } else if (norm === 'PRIORITY') {
    colorClasses = 'bg-violet-100 text-violet-800 border-violet-300 font-semibold';
    dotColor = 'bg-violet-600';
  } else if (norm === 'NORMAL') {
    colorClasses = 'bg-slate-100 text-slate-750 border-slate-200';
    dotColor = 'bg-slate-400';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 font-medium'
      : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{norm}</span>
    </span>
  );
};
