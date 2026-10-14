import React from 'react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-9 h-9 border-3',
    lg: 'w-14 h-14 border-4',
  }[size] || 'w-9 h-9 border-3';

  return (
    <div
      role="status"
      aria-live="polite"
      className="py-16 flex flex-col items-center justify-center text-center space-y-3"
    >
      <div
        className={`${sizeClasses} border-emerald-600 border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="font-semibold text-slate-600 text-sm tracking-wide">
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}
