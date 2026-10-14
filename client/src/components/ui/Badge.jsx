import React from 'react';

const VARIANT_MAP = {
  default: 'bg-slate-100 text-slate-800 border-slate-200',
  success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  warning: 'bg-amber-100 text-amber-900 border-amber-300',
  danger: 'bg-rose-100 text-rose-900 border-rose-300',
  info: 'bg-indigo-100 text-indigo-900 border-indigo-300',
};

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.default;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
