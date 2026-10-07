import React, { useState } from 'react';
import { Service, PriorityLevel } from '../types';
import { Users, Clock, Monitor, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onJoin: (serviceId: string | number, priority: PriorityLevel) => Promise<void>;
  isRecommended?: boolean;
  disabled?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onJoin,
  isRecommended = false,
  disabled = false,
}) => {
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const handleJoinSubmit = async () => {
    setSubmitting(true);
    try {
      await onJoin(service.id, selectedPriority);
      setShowPriorityModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-md ${
          isRecommended
            ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-sm'
            : 'border-slate-200 shadow-xs'
        }`}
      >
        {isRecommended && (
          <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold text-white uppercase tracking-wider shadow-xs">
            <Zap className="w-3 h-3 text-amber-300" />
            Recommended Queue
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold font-mono text-lg border border-blue-100">
                {service.code}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
                <span className="text-[11px] font-medium text-slate-500">Service Code: {service.code}</span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
            {service.description}
          </p>

          {/* Stats matrix */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 border border-slate-100 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                <Monitor className="w-3 h-3 text-slate-400" /> Counters
              </span>
              <span className="mt-0.5 text-sm font-bold text-slate-800">
                {service.active_counters} Active
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-slate-200 px-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" /> Waiting
              </span>
              <span className="mt-0.5 text-sm font-bold text-amber-700">
                {service.waiting_count} Tokens
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Est. Wait
              </span>
              <span className="mt-0.5 text-sm font-bold text-blue-700">
                ~{service.estimated_wait_minutes} min
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPriorityModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Join Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Priority Selection Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900">
              Join Queue: {service.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select your queue priority class before generating a digital token.
            </p>

            <div className="mt-5 space-y-3">
              {/* Normal priority */}
              <label
                onClick={() => setSelectedPriority('NORMAL')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPriority === 'NORMAL'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={selectedPriority === 'NORMAL'}
                  onChange={() => setSelectedPriority('NORMAL')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Normal Priority</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">Standard</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard chronological queue routing based on arrival order.
                  </p>
                </div>
              </label>

              {/* Priority ticket */}
              <label
                onClick={() => setSelectedPriority('PRIORITY')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPriority === 'PRIORITY'
                    ? 'border-violet-600 bg-violet-50/50 ring-1 ring-violet-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="PRIORITY"
                  checked={selectedPriority === 'PRIORITY'}
                  onChange={() => setSelectedPriority('PRIORITY')}
                  className="mt-1 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Priority Pass</span>
                    <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded">Express</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Priority placement for senior citizens, emergencies, or VIP requests.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowPriorityModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleJoinSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Generate Token</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
