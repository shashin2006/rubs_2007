import React, { useState } from 'react';
import { Wifi, WifiOff, Settings, Check, X, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BackendStatusBanner: React.FC = () => {
  const { apiUrl, backendOnline, simulationMode, toggleSimulationMode, updateApiUrl, checkHealth } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiUrl(inputUrl);
    setShowConfig(false);
  };

  const handleTestNow = async () => {
    setIsTesting(true);
    await checkHealth();
    setIsTesting(false);
  };

  return (
    <div className="border-b border-slate-200 bg-slate-900 text-white text-xs px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-slate-400 text-[11px]">
            {simulationMode
              ? 'Local prototype mode enabled for demonstration'
              : backendOnline === false
              ? 'Start FastAPI at 127.0.0.1:8000 or switch to Sandbox'
              : 'Target: Distributed Cloud Queue Node'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!simulationMode && backendOnline === false && (
            <button
              type="button"
              onClick={() => toggleSimulationMode(true)}
              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
            >
              Use Sandbox Mode
            </button>
          )}

          {simulationMode && (
            <button
              type="button"
              onClick={() => toggleSimulationMode(false)}
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              Connect to FastAPI
            </button>
          )}

          <button
            type="button"
            onClick={handleTestNow}
            disabled={isTesting}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Ping backend now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Configure API Base URL"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig && (
        <form
          onSubmit={handleSaveUrl}
          className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2"
        >
          <label className="text-slate-300 text-[11px]">Backend API Base URL:</label>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-white font-mono flex-1 min-w-[240px] focus:outline-hidden focus:border-blue-500"
            placeholder="http://127.0.0.1:8000/api"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
          >
            <Check className="w-3 h-3" /> Save
          </button>
          <button
            type="button"
            onClick={() => {
              setInputUrl('http://127.0.0.1:8000/api');
              updateApiUrl('http://127.0.0.1:8000/api');
            }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
          >
            Reset Default
          </button>
          <button
            type="button"
            onClick={() => setShowConfig(false)}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
