import { cn } from '@/lib/cn';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

const sizeConfig = {
  sm: { size: 40, strokeWidth: 3, radius: 16 },
  md: { size: 56, strokeWidth: 4, radius: 22 },
  lg: { size: 72, strokeWidth: 5, radius: 29 },
} as const;

export default function ProgressRing({
  progress,
  size = 'md',
  color = 'var(--color-primary)',
  className,
  children,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="-rotate-90"
      >
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.radius}
          fill="none"
          stroke="var(--color-bg-warm)"
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
