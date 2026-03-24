'use client';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-body font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        className={`
          w-full px-4 py-3.5 rounded-2xl min-h-[52px]
          glass border border-[var(--glass-border)]
          text-[#F1F5F9] placeholder-[rgba(255,255,255,0.25)]
          font-body text-base
          focus:outline-none focus:border-[var(--amber-border)]
          focus:shadow-[0_0_0_1px_rgba(217,119,6,0.2)]
          transition-all duration-200
          ${error ? 'border-[rgba(239,68,68,0.4)]' : ''}
          ${className}
        `}
      />
      {error && (
        <p className="text-xs text-[#EF4444] font-body">{error}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
