import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading queue data...',
  size = 'md',
}) => {
  const spinnerDimensions =
    size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-3' : 'w-6 h-6 border-2';

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-slate-500">
      <div
        className={`${spinnerDimensions} rounded-full border-blue-200 border-t-blue-700 animate-spin`}
        role="status"
        aria-label="loading"
      />
      {message && <p className="text-xs font-medium text-slate-600 animate-pulse">{message}</p>}
    </div>
  );
};
