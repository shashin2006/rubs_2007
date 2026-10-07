import React, { useState, useEffect, useCallback } from 'react';
import { getServices, getQueueStatus } from '../api/api';
import { Service, QueueStatus as IQueueStatus } from '../types';
import { QueueStatusCard } from '../components/QueueStatusCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Activity, RefreshCw, Radio } from 'lucide-react';

export const QueueStatusPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [statuses, setStatuses] = useState<Record<string | number, IQueueStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string | number | 'ALL'>('ALL');

  const pollQueueStatus = useCallback(async () => {
    try {
      // 1. Fetch available services first
      const srvList = await getServices();
      setServices(srvList);

      // 2. Fetch status for each service
      const statusResults = await Promise.all(
        srvList.map(async (s) => {
          try {
            const st = await getQueueStatus(s.id);
            return { id: s.id, status: st };
          } catch {
            return {
              id: s.id,
              status: {
                service_id: s.id,
                service_name: s.name,
                service_code: s.code,
                current_token: null,
                users_ahead: s.waiting_count,
                estimated_wait_minutes: s.estimated_wait_minutes,
                active_counters: s.active_counters,
                waiting_count: s.waiting_count,
                status: 'IDLE',
              } as IQueueStatus,
            };
          }
        })
      );

      const statusMap: Record<string | number, IQueueStatus> = {};
      statusResults.forEach((item) => {
        statusMap[item.id] = item.status;
      });

      setStatuses(statusMap);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to poll queue status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pollQueueStatus();
    // Poll the backend every 6 seconds as requested (5-10s requirement)
    const interval = setInterval(pollQueueStatus, 6000);
    return () => clearInterval(interval);
  }, [pollQueueStatus]);

  const displayedServices =
    selectedServiceId === 'ALL'
      ? services
      : services.filter((s) => String(s.id) === String(selectedServiceId));

  if (loading && services.length === 0) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Connecting to live queue monitor..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Live Queue Status
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              Polling (6s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual display monitor for all campus departmental counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={pollQueueStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Now</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={pollQueueStatus} />}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedServiceId('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedServiceId === 'ALL'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Departments ({services.length})
        </button>

        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedServiceId(s.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedServiceId === s.id
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Grid of Live Queue Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedServices.map((service) => {
          const status = statuses[service.id] || {
            service_id: service.id,
            service_name: service.name,
            service_code: service.code,
            current_token: null,
            users_ahead: service.waiting_count,
            estimated_wait_minutes: service.estimated_wait_minutes,
            active_counters: service.active_counters,
            waiting_count: service.waiting_count,
            status: 'ACTIVE',
          };

          return (
            <QueueStatusCard
              key={service.id}
              status={status}
              lastUpdated={lastUpdated}
              onRefresh={pollQueueStatus}
            />
          );
        })}
      </div>
    </div>
  );
};
