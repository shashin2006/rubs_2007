import React, { useState, useEffect, useCallback } from 'react';
import { getAdminDashboard } from '../api/api';
import { AdminDashboardData } from '../types';
import { StatisticCard } from '../components/StatisticCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  Users,
  Monitor,
  Clock,
  CheckCircle2,
  SkipForward,
  XCircle,
  RefreshCw,
  BarChart3,
  Server,
  Cloud,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Poll admin stats every 8 seconds
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !data) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Calculating distributed queue telemetry..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              System Administration & Analytics
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              Admin Node
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global distributed throughput, counter availability, and service-level workload analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchStats} />}

      {/* 6 Required Statistic Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatisticCard
              label="Total Users"
              value={data.total_users}
              icon={<Users className="w-5 h-5" />}
              subtext="Registered clients"
              variant="blue"
            />
            <StatisticCard
              label="Active Counters"
              value={data.active_counters}
              icon={<Monitor className="w-5 h-5" />}
              subtext="Staffed stations"
              variant="slate"
            />
            <StatisticCard
              label="Waiting"
              value={data.waiting_tokens}
              icon={<Clock className="w-5 h-5" />}
              subtext="In queue queue"
              variant="amber"
            />
            <StatisticCard
              label="Served"
              value={data.served_tokens}
              icon={<CheckCircle2 className="w-5 h-5" />}
              subtext="Successfully finished"
              variant="emerald"
            />
            <StatisticCard
              label="Skipped"
              value={data.skipped_tokens}
              icon={<SkipForward className="w-5 h-5" />}
              subtext="No-show tokens"
              variant="purple"
            />
            <StatisticCard
              label="Cancelled"
              value={data.cancelled_tokens}
              icon={<XCircle className="w-5 h-5" />}
              subtext="Withdrawn tokens"
              variant="rose"
            />
          </div>

          {/* Service-wise queue statistics & visualizations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Service-Wise Queue Performance
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Departmental distribution & load ratios
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {data.services?.map((svc) => {
                const totalTokensForService = Math.max(1, svc.waiting_count + svc.served_count);
                const waitRatio = Math.round((svc.waiting_count / totalTokensForService) * 100);
                const servedRatio = 100 - waitRatio;

                return (
                  <div key={svc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-mono font-bold text-xs">
                          {svc.code}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{svc.name}</h4>
                          <span className="text-[11px] text-slate-500">
                            {svc.active_counters} Active Counters · Average Wait ~{svc.avg_wait_minutes}m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Waiting: {svc.waiting_count}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Served: {svc.served_count}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visualization */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wide">
                        <span>Waiting Queue Share ({waitRatio}%)</span>
                        <span>Served Throughput ({servedRatio}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-amber-500 transition-all duration-500"
                          style={{ width: `${waitRatio}%` }}
                          title={`Waiting: ${svc.waiting_count}`}
                        />
                        <div
                          className="bg-emerald-500 transition-all duration-500"
                          style={{ width: `${servedRatio}%` }}
                          title={`Served: ${svc.served_count}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distributed Architecture Mini-Project Info */}
        </>
      )}
    </div>
  );
};
