import React from 'react';

const VARIANT_MAP = {
  primary: 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 focus:ring-emerald-500',
  secondary: 'bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-800 focus:ring-indigo-500',
  outline: 'bg-transparent hover:bg-slate-100 text-slate-800 border-slate-300 focus:ring-slate-400',
  danger: 'bg-rose-700 hover:bg-rose-800 text-white border-rose-800 focus:ring-rose-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent shadow-none focus:ring-slate-300',
};

const SIZE_MAP = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-xs sm:text-sm',
  lg: 'px-6 py-3 text-sm sm:text-base font-extrabold',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl shadow border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
