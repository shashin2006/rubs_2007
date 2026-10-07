import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyToken,
  getServices,
  recommendQueue,
  cancelToken,
  joinQueue,
} from '../api/api';
import { Service, TokenItem, QueueRecommendation, PriorityLevel } from '../types';
import { TokenCard } from '../components/TokenCard';
import { ServiceCard } from '../components/ServiceCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import {
  Sparkles,
  Ticket,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeToken, setActiveToken] = useState<TokenItem | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [recommendation, setRecommendation] = useState<QueueRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [tokenRes, servicesRes, recRes] = await Promise.allSettled([
        getMyToken(),
        getServices(),
        recommendQueue(),
      ]);

      if (tokenRes.status === 'fulfilled') {
        setActiveToken(tokenRes.value);
      } else {
        // If 404 or no token, it's fine
        setActiveToken(null);
      }

      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value);
      } else {
        throw servicesRes.reason;
      }

      if (recRes.status === 'fulfilled') {
        setRecommendation(recRes.value);
      }

      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load queue dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Auto refresh active token & services every 8 seconds
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleCancelToken = async (tokenId: string | number) => {
    try {
      await cancelToken(tokenId);
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel token.');
    }
  };

  const handleJoinQueue = async (serviceId: string | number, priority: PriorityLevel) => {
    try {
      const token = await joinQueue({ service_id: serviceId, priority });
      setActiveToken(token);
      await loadDashboardData();
      navigate('/my-token');
    } catch (err: any) {
      setError(err.message || 'Failed to join queue.');
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Connecting to queue services..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your queue position, view live wait times, or request new service tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            Synced: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadDashboardData} />}

      {/* Recommended Queue Callout */}
      {recommendation && !activeToken && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Recommended Queue
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    Fastest Service
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {recommendation.service_name}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {recommendation.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:border-l sm:border-blue-100 sm:pl-6 shrink-0">
              <div className="text-right sm:text-left">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Est. Wait Time
                </span>
                <span className="text-xl font-bold text-blue-900">
                  ~{recommendation.estimated_wait_minutes} min
                </span>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>View Queues</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Active Token Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Current Active Token
            </h2>
          </div>
          {activeToken && (
            <Link
              to="/my-token"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Full Details <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {activeToken ? (
          <div className="max-w-xl">
            <TokenCard token={activeToken} onCancel={handleCancelToken} />
          </div>
        ) : (
          <EmptyState
            icon={<Ticket className="w-8 h-8 text-blue-400" />}
            title="No Active Queue Token"
            description="You do not currently have a waiting or active queue token. Select a service below to take a digital number."
            actionText="Browse Services & Join"
            onAction={() => navigate('/services')}
          />
        )}
      </div>

      {/* Available Services Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Available Queue Services
            </h2>
          </div>
          <Link
            to="/queue-status"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            Live Monitor <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="No Services Available"
            description="Queue services are currently offline or being initialized by the administrator."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onJoin={handleJoinQueue}
                isRecommended={recommendation?.service_id === service.id}
                disabled={!!activeToken && activeToken.status === 'WAITING'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
