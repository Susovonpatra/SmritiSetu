import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 pb-4 border-b border-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-lg sm:text-xl font-extrabold text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}
