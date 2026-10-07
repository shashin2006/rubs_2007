import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCounters,
  getCounterQueue,
  callNextToken,
  serveToken,
  skipToken,
  cancelCounterToken,
} from '../api/api';
import { Counter, TokenItem } from '../types';
import { CounterCard } from '../components/CounterCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import {
  PhoneCall,
  CheckCircle2,
  SkipForward,
  XCircle,
  Clock,
  Users,
  Monitor,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const CounterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<TokenItem[]>([]);
  const [currentToken, setCurrentToken] = useState<TokenItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal confirm state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const loadCountersAndQueue = useCallback(async () => {
    try {
      const counterList = await getCounters();
      setCounters(counterList);

      let targetCounter = selectedCounter;
      if (!targetCounter) {
        // Find assigned counter for current user or default to first
        targetCounter =
          counterList.find((c) => String(c.id) === String(user?.assigned_counter_id)) ||
          counterList[0] ||
          null;
        setSelectedCounter(targetCounter);
      } else {
        // Refresh targetCounter state
        const refreshed = counterList.find((c) => c.id === targetCounter?.id);
        if (refreshed) targetCounter = refreshed;
      }

      if (targetCounter) {
    const queueResponse: unknown = await getCounterQueue(targetCounter.id);

    let queue: TokenItem[] = [];

    if (Array.isArray(queueResponse)) {
        queue = queueResponse as TokenItem[];
    } else if (
        queueResponse !== null &&
        typeof queueResponse === 'object'
    ) {
        const response = queueResponse as {
            queue?: unknown;
            tokens?: unknown;
            items?: unknown;
            data?: unknown;
        };

        const candidate =
            response.queue ??
            response.tokens ??
            response.items ??
            response.data;

        if (Array.isArray(candidate)) {
            queue = candidate as TokenItem[];
        }
    }

    setWaitingQueue(queue);

// Find the token currently called/being served.
// The counter API may return the active token in the queue
// even when targetCounter.current_token is not populated.
const activeToken = queue.find(
    (item: TokenItem) =>
        item.status === 'CALLED' || item.status === 'SERVING'
);

if (activeToken) {
    setCurrentToken({
        ...activeToken,
        status: 'SERVING',
        counter_number: targetCounter.counter_number,
    });
} else if (targetCounter.current_token) {
    setCurrentToken({
        id: targetCounter.current_token_id || 999,
        token_number: targetCounter.current_token,
        service_id: targetCounter.service_id,
        service_name: targetCounter.service_name,
        position: 0,
        estimated_wait_minutes: 0,
        status: 'SERVING',
        priority: 'NORMAL',
        created_at: new Date().toISOString(),
        counter_number: targetCounter.counter_number,
    });
} else {
    setCurrentToken(null);
}      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load counter data.');
    } finally {
      setLoading(false);
    }
  }, [selectedCounter, user?.assigned_counter_id]);

  useEffect(() => {
    loadCountersAndQueue();
    // Poll counter queue every 6 seconds
    const interval = setInterval(loadCountersAndQueue, 6000);
    return () => clearInterval(interval);
  }, [loadCountersAndQueue]);

  const handleCallNext = async () => {
    if (!selectedCounter) return;
    setActionLoading(true);
    setError(null);
    try {
      const nextToken = await callNextToken(selectedCounter.id);
      setCurrentToken(nextToken);
      await loadCountersAndQueue();
    } catch (err: any) {
      setError(err.message || 'No tokens in queue or call failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleServe = async () => {
    if (!selectedCounter || !currentToken) return;
    setActionLoading(true);
    setError(null);
    try {
      await serveToken(selectedCounter.id, currentToken.id);
      setCurrentToken(null);
      await loadCountersAndQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to serve token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!selectedCounter || !currentToken) return;
    setActionLoading(true);
    setError(null);
    try {
      await skipToken(selectedCounter.id, currentToken.id);
      setCurrentToken(null);
      await loadCountersAndQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to skip token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelCurrent = () => {
    if (!selectedCounter || !currentToken) return;
    setModalConfig({
      isOpen: true,
      title: 'Cancel Token',
      message: `Are you sure you want to cancel token ${currentToken.token_number}? This will permanently remove it from the active session.`,
      isDestructive: true,
      confirmText: 'Yes, Cancel Token',
      action: async () => {
        setActionLoading(true);
        try {
          await cancelCounterToken(selectedCounter.id, currentToken.id);
          setCurrentToken(null);
          await loadCountersAndQueue();
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          setError(err.message || 'Failed to cancel token.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading && counters.length === 0) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Loading counter console..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Counter Operator Terminal
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Operator: {user?.name || 'Staff'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch, serve, or manage waiting queue tokens at physical service counters.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCountersAndQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadCountersAndQueue} />}

      {/* Available Counters Switcher */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Select Active Counter
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {counters.map((c) => (
            <CounterCard
              key={c.id}
              counter={c}
              isSelected={selectedCounter?.id === c.id}
              onSelect={(cnt) => {
                setSelectedCounter(cnt);
                setWaitingQueue([]);
                setCurrentToken(null);
              }}
            />
          ))}
        </div>
      </div>

      {selectedCounter && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Serving Station */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Counter #{selectedCounter.counter_number}
                </span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedCounter.service_name}
                </span>
              </div>

              {/* Prominent Current Token Display */}
              <div className="my-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Currently Serving
                </span>

                <div className="mt-2 mb-3">
                  {currentToken ? (
                    <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-500 text-blue-900 shadow-inner">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight block">
                        {currentToken.token_number}
                      </span>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <StatusBadge status={currentToken.status} size="sm" />
                        {currentToken.priority === 'PRIORITY' && (
                          <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded">
                            PRIORITY
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                      <p className="text-base font-semibold">Counter Idle</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click "Call Next" to invite the next token holder.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={actionLoading || waitingQueue.length === 0}
                  onClick={handleCallNext}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Next Token</span>
                </button>

                {currentToken && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleServe}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                      <span>Serve</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSkip}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4 text-purple-600 mb-1" />
                      <span>Skip</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleCancelCurrent}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-600 mb-1" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Counter Info */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Waiting in this queue:</span>
                <strong className="text-slate-900 font-bold">{waitingQueue.length} tokens</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated queue clear time:</span>
                <strong className="text-blue-700 font-bold">~{waitingQueue.length * 4} min</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Waiting Queue Table */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Waiting Queue ({waitingQueue.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tokens awaiting service in {selectedCounter.service_name}
                  </p>
                </div>
                {waitingQueue.length > 0 && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    Next up: <strong className="font-mono text-blue-700">{waitingQueue[0].token_number}</strong>
                  </span>
                )}
              </div>

              {waitingQueue.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="Queue is Clear"
                    description={`No citizens or students are currently waiting for ${selectedCounter.service_name}. New incoming tokens will appear here automatically.`}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Position</th>
                        <th className="py-3 px-4">Token</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Wait</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waitingQueue.map((item, index) => {
                        const isNext = index === 0;
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isNext ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-slate-500">
                              #{index + 1}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-sm text-slate-900">
                              {item.token_number}
                              {isNext && (
                                <span className="ml-2 text-[10px] font-sans font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  NEXT
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={item.priority} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {item.estimated_wait_minutes} min
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isNext && (
                                <button
                                  type="button"
                                  onClick={handleCallNext}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium text-xs shadow-xs cursor-pointer"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>Call</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        isDestructive={modalConfig.isDestructive}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.action}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
