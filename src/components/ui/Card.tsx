import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

type CardVariant = 'learning' | 'game' | 'category' | 'sticker';

interface CardProps {
  variant?: CardVariant;
  completed?: boolean;
  locked?: boolean;
  categoryColor?: 'numbers' | 'hangul' | 'english' | 'games';
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  learning: 'bg-bg-warm shadow-card',
  game: 'bg-bg-soft shadow-card',
  category: 'shadow-card',
  sticker: 'bg-white shadow-card border border-accent-yellow/20',
};

const categoryBgStyles: Record<string, string> = {
  numbers: 'bg-numbers/15',
  hangul: 'bg-hangul/15',
  english: 'bg-english/15',
  games: 'bg-games/15',
};

export default function Card({
  variant = 'learning',
  completed = false,
  locked = false,
  categoryColor,
  className,
  children,
  onClick,
}: CardProps) {
  const motionProps: HTMLMotionProps<'div'> = {
    whileTap: locked ? undefined : { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-card p-4 touch-manipulation select-none',
        variant === 'category' && categoryColor ? categoryBgStyles[categoryColor] : variantStyles[variant],
        completed && 'ring-2 ring-success/50',
        locked && 'opacity-50 grayscale',
        onClick && !locked && 'cursor-pointer',
        className,
      )}
      onClick={locked ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !locked ? 0 : undefined}
      {...motionProps}
    >
      {completed && (
        <div className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-success shadow-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-card bg-black/10">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="8" y="14" width="16" height="14" rx="3" fill="#B2BEC3" />
            <path d="M12 14V10C12 7.79 13.79 6 16 6C18.21 6 20 7.79 20 10V14" stroke="#B2BEC3" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {children}
    </motion.div>
  );
}
