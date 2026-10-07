import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyToken, cancelToken } from '../api/api';
import { TokenItem } from '../types';
import { TokenCard } from '../components/TokenCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Ticket, RefreshCw, AlertCircle } from 'lucide-react';

export const MyToken: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<TokenItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const fetchToken = useCallback(async () => {
    try {
      const active = await getMyToken();
      setToken(active);
      setError(null);
      setLastSynced(new Date());
    } catch (err: any) {
      if (err.status === 404) {
        setToken(null);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch active token.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
    // Poll active token every 6 seconds to update position and status
    const interval = setInterval(fetchToken, 6000);
    return () => clearInterval(interval);
  }, [fetchToken]);

  const handleCancel = async (tokenId: string | number) => {
    try {
      await cancelToken(tokenId);
      await fetchToken();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel token.');
    }
  };

  if (loading && !token) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Checking active queue tokens..." size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Digital Token
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates and queue position
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={fetchToken}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchToken} />}

      {token ? (
        <div className="space-y-4">
          <TokenCard token={token} onCancel={handleCancel} />

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              Queue Etiquette & Instructions
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
              <li>Please keep this tab open or note your token number.</li>
              <li>When your token turns to <strong>SERVING</strong>, proceed immediately to the counter.</li>
              <li>Tokens not claimed within 3 minutes of calling may be skipped.</li>
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Ticket className="w-8 h-8 text-blue-400" />}
          title="No Active Token Found"
          description="You do not currently have any active token waiting in any department queue."
          actionText="Join a Queue Now"
          onAction={() => navigate('/services')}
        />
      )}
    </div>
  );
};
