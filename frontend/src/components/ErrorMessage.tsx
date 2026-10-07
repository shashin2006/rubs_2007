import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  isBackendUnavailable?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  isBackendUnavailable,
}) => {
  const { apiUrl, toggleSimulationMode } = useAuth();
  if (!error) return null;

  const isNetworkOrUnavailable =
    isBackendUnavailable ||
    error.includes('Backend unavailable') ||
    error.includes('Failed to fetch') ||
    error.includes('NetworkError');

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5 shadow-xs transition-all my-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900 mb-1">
            {isNetworkOrUnavailable
              ? 'Backend unavailable. Please start the FastAPI server.'
              : 'Action Failed'}
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed font-mono break-words">
            {error}
          </p>

          {isNetworkOrUnavailable && (
            <div className="mt-3 pt-3 border-t border-rose-200/70 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                <span>Backend Connection Details</span>
              </div>
              <p className="text-slate-600">
                The frontend is attempting to connect to <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[11px]">{apiUrl}</code>.
              </p>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
                # In your backend directory:
                <br />
                uvicorn main:app --reload --host 127.0.0.1 --port 8000
              </div>
              <div className="text-[11px] text-slate-600">
                Tip: Ensure FastAPI has CORS configured with <code className="bg-slate-100 px-1 rounded">CORSMiddleware</code> allowing your frontend origin.
              </div>
            </div>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Request</span>
              </button>
            )}

            {isNetworkOrUnavailable && (
              <button
                type="button"
                onClick={() => toggleSimulationMode(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Enable Demo Simulation Sandbox</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
