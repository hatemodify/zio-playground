import { cn } from '@/lib/cn';

type BadgeVariant = 'star' | 'level' | 'streak' | 'new' | 'locked';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  star: 'bg-accent-yellow text-text-dark',
  level: 'bg-primary text-white',
  streak: 'bg-accent-orange text-white',
  new: 'bg-reward text-white',
  locked: 'bg-text-light text-white',
};

export default function Badge({ variant = 'level', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
