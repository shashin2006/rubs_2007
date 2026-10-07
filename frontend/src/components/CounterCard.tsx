import React from 'react';
import { Counter } from '../types';
import { Monitor, CheckCircle, UserCheck } from 'lucide-react';

interface CounterCardProps {
  counter: Counter;
  isSelected?: boolean;
  onSelect?: (counter: Counter) => void;
}

export const CounterCard: React.FC<CounterCardProps> = ({
  counter,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect && onSelect(counter)}
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Counter #{counter.counter_number}</h4>
            <p className="text-[11px] text-slate-500">{counter.service_name}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
            counter.is_active
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${counter.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
          {counter.is_active ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>{counter.operator_name || 'Unassigned'}</span>
        </div>

        <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
          <span className="text-[10px] uppercase font-sans text-slate-400 font-normal">Active:</span>
          <span className={counter.current_token ? 'text-blue-700' : 'text-slate-400 font-normal italic'}>
            {counter.current_token || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};
