'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary:   'bg-gradient-to-b from-amber-500 to-amber-600 text-bg-deep font-semibold shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_28px_rgba(217,119,6,0.4)]',
  secondary: 'glass-outline text-[#F1F5F9] hover:border-[rgba(255,255,255,0.18)]',
  ghost:     'text-[rgba(255,255,255,0.5)] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.04)]',
  danger:    'bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.22)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl min-h-[36px]',
  md: 'px-5 py-3 text-base rounded-2xl min-h-[44px]',
  lg: 'px-6 py-4 text-base rounded-2xl min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      {...props}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        font-display transition-all duration-200 relative overflow-hidden
        disabled:opacity-40 disabled:pointer-events-none
        flex items-center justify-center gap-2 w-full
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : children}
    </motion.button>
  );
}
