import React, { useState } from 'react';
import { TokenItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Clock, Users, Calendar, AlertCircle, Ban, CheckCircle2, ChevronRight } from 'lucide-react';

interface TokenCardProps {
  token: TokenItem;
  onCancel?: (tokenId: string | number) => Promise<void>;
  isCompact?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onCancel,
  isCompact = false,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(token.id);
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = token.status === 'CANCELLED';
  const isServed = token.status === 'SERVED';
  const isServing = token.status === 'SERVING';
  const isWaiting = token.status === 'WAITING';

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all ${
          isServing
            ? 'border-blue-300 bg-gradient-to-b from-blue-50/70 to-white shadow-md'
            : isCancelled
            ? 'border-rose-200 bg-rose-50/20 shadow-xs opacity-80'
            : isServed
            ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
            : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
        }`}
      >
        {/* Top header badge */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Digital Token
            </span>
            {token.priority === 'PRIORITY' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
                Priority
              </span>
            )}
          </div>
          <StatusBadge status={token.status} size="md" />
        </div>

        {/* Center Token Display */}
        <div className="p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Token Number
          </p>
          <div className="my-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-slate-900 px-4 py-1.5 rounded-xl bg-slate-100 inline-block border border-slate-200 shadow-inner">
              {token.token_number}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            {token.service_name}
          </h3>

          {isServing && (
            <div className="mt-3 p-3 rounded-xl bg-blue-100/80 border border-blue-200 text-blue-900 text-xs font-semibold animate-pulse flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>
                Please proceed to{' '}
                {token.counter_number ? `Counter #${token.counter_number}` : 'Assigned Counter'} immediately!
              </span>
            </div>
          )}

          {/* Grid stats: Position & Wait Time */}
          <div className="mt-6 grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex flex-col items-center justify-center p-2 border-r border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Your Position</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">
                {isWaiting ? (token.position > 0 ? token.position : 'Next') : '—'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isWaiting && token.position > 1 ? `${token.position - 1} ahead of you` : 'Ready'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Est. Wait</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">
                {isWaiting ? `${token.estimated_wait_minutes}m` : '0m'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isWaiting ? 'Calculated wait' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Progress bar visual for queue progress */}
          {isWaiting && (
            <div className="mt-5 text-left">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Queue Position Progress</span>
                <span className="font-medium text-slate-700">
                  {token.position <= 1 ? 'Next in line' : `${token.position} in queue`}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(15, Math.min(100, 100 - (token.position - 1) * 18))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer details: Created time & actions */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {token.created_at ? new Date(token.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
            </span>

            {isWaiting && onCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Token</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Active Token?"
        message={`Are you sure you want to cancel token ${token.token_number}? You will forfeit your position #${token.position} in the ${token.service_name} queue.`}
        confirmText="Yes, Cancel Token"
        cancelText="Keep Token"
        isDestructive={true}
        isLoading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
};
