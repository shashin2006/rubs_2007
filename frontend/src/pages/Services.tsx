import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, recommendQueue, joinQueue, getMyToken } from '../api/api';
import { Service, QueueRecommendation, PriorityLevel, TokenItem } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { TokenCard } from '../components/TokenCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Zap, Info, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [recommendation, setRecommendation] = useState<QueueRecommendation | null>(null);
  const [existingToken, setExistingToken] = useState<TokenItem | null>(null);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<TokenItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const [srvList, rec, active] = await Promise.allSettled([
        getServices(),
        recommendQueue(),
        getMyToken(),
      ]);

      if (srvList.status === 'fulfilled') {
        setServices(srvList.value);
      } else {
        throw srvList.reason;
      }

      if (rec.status === 'fulfilled') {
        setRecommendation(rec.value);
      }

      if (active.status === 'fulfilled') {
        setExistingToken(active.value);
      } else {
        setExistingToken(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoin = async (serviceId: string | number, priority: PriorityLevel) => {
    setError(null);
    try {
      const token = await joinQueue({ service_id: serviceId, priority });
      setNewlyCreatedToken(token);
      setExistingToken(token);
    } catch (err: any) {
      setError(err.message || 'Failed to join queue.');
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Loading queue services and wait times..." size="lg" />
      </div>
    );
  }

  // If user just created a token, show prominent success & digital token card
  if (newlyCreatedToken) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Success!</p>
              <p className="text-xs text-emerald-700">Digital token generated successfully.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewlyCreatedToken(null)}
            className="text-xs text-emerald-800 hover:underline font-medium cursor-pointer"
          >
            Join Another Queue
          </button>
        </div>

        <TokenCard
          token={newlyCreatedToken}
          onCancel={async () => {
            setNewlyCreatedToken(null);
            loadData();
          }}
        />

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/queue-status')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 cursor-pointer"
          >
            Track Live Display
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Service Selection & Token Dispatch
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select a departmental queue service to generate an official digital token.
        </p>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {existingToken && existingToken.status === 'WAITING' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs">
              You currently hold active token <strong className="font-mono">{existingToken.token_number}</strong> in{' '}
              <strong>{existingToken.service_name}</strong>. Cancel it or wait for completion to join another queue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/my-token')}
            className="text-xs font-bold text-amber-900 underline shrink-0 ml-3 cursor-pointer"
          >
            View Active Token
          </button>
        </div>
      )}

      {/* Recommended Queue Banner */}
      {recommendation && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Recommended For You
              </span>
              <span className="text-[11px] font-semibold text-slate-900">
                {recommendation.service_name}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Estimated wait: <strong>{recommendation.estimated_wait_minutes} min</strong>. {recommendation.reason}
            </p>
          </div>
        </div>
      )}

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onJoin={handleJoin}
            isRecommended={recommendation?.service_id === service.id}
            disabled={!!existingToken && existingToken.status === 'WAITING'}
          />
        ))}
      </div>
    </div>
  );
};
