import React from 'react';
import { QueueStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { Users, Clock, Monitor, RefreshCw, Activity } from 'lucide-react';

interface QueueStatusCardProps {
  status: QueueStatus;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isPolling?: boolean;
}

export const QueueStatusCard: React.FC<QueueStatusCardProps> = ({
  status,
  lastUpdated,
  onRefresh,
  isPolling = true,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono border border-blue-100">
              {status.service_code || 'SRV'}
            </span>
            <h3 className="text-base font-bold text-slate-900">{status.service_name}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Queue Status
            {lastUpdated && (
              <span className="text-slate-400">
                · Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={status.status || 'ACTIVE'} size="sm" />
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh queue status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main token display */}
      <div className="my-5 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Currently Serving
        </span>
        <div className="mt-1">
          {status.current_token ? (
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-900 tracking-tight">
              {status.current_token}
            </span>
          ) : (
            <span className="text-2xl font-semibold text-slate-400 italic">
              No active token
            </span>
          )}
        </div>
      </div>

      {/* Metric 3-column grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-medium">
            <Users className="w-3 h-3 text-slate-400" /> Waiting
          </div>
          <p className="mt-1 text-base font-bold text-slate-800">
            {status.waiting_count ?? status.users_ahead}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-medium">
            <Clock className="w-3 h-3 text-slate-400" /> Est. Wait
          </div>
          <p className="mt-1 text-base font-bold text-blue-700">
            ~{status.estimated_wait_minutes}m
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-medium">
            <Monitor className="w-3 h-3 text-slate-400" /> Counters
          </div>
          <p className="mt-1 text-base font-bold text-slate-800">
            {status.active_counters}
          </p>
        </div>
      </div>
    </div>
  );
};
