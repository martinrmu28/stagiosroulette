'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type Variant = 'default' | 'amber' | 'elevated' | 'outline';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

const variantClass: Record<Variant, string> = {
  default:  'glass',
  amber:    'glass-amber',
  elevated: 'glass-elevated',
  outline:  'glass-outline',
};

export function GlassCard({
  variant = 'default',
  children,
  className = '',
  animate: doAnimate = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      {...(doAnimate ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: 'easeOut' },
      } : {})}
      {...props}
      className={`${variantClass[variant]} rounded-3xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
