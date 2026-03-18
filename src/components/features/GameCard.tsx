import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface GameCardProps {
  gameId: string;
  name: string;
  illustration?: React.ReactNode;
  locked?: boolean;
  bestScore?: number;
  difficulty?: 1 | 2 | 3;
  onClick?: () => void;
  className?: string;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1L9.8 5.5L14.5 6.1L11 9.4L11.8 14L8 12L4.2 14L5 9.4L1.5 6.1L6.2 5.5L8 1Z"
        fill={filled ? '#FFD93D' : '#E0E0E0'}
        stroke={filled ? '#E6C235' : '#CCC'}
        strokeWidth="0.5"
      />
    </svg>
  );
}

function GameCard({
  name,
  illustration,
  locked = false,
  bestScore,
  difficulty = 1,
  onClick,
  className,
}: GameCardProps) {
  return (
    <motion.button
      className={cn(
        'relative flex min-h-[120px] w-full flex-row items-center gap-4 overflow-hidden',
        'rounded-card bg-bg-soft p-4 shadow-card',
        'touch-manipulation select-none transition-all duration-200',
        !locked && 'hover:shadow-card-hover',
        locked && 'opacity-60 grayscale-[30%]',
        className,
      )}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      whileTap={locked ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={`${name}${locked ? ' (잠김)' : ''}`}
    >
      {/* Game illustration */}
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-radius-lg bg-games/10">
        {illustration ?? (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="12" width="32" height="24" rx="6" fill="var(--color-games)" fillOpacity="0.3" />
            <circle cx="19" cy="24" r="4" fill="var(--color-games)" />
            <circle cx="31" cy="21" r="3" fill="var(--color-games)" />
            <circle cx="31" cy="28" r="3" fill="var(--color-games)" />
          </svg>
        )}
      </div>

      {/* Game info */}
      <div className="flex flex-1 flex-col items-start gap-1.5">
        <span className="font-display text-lg font-bold text-text-dark">
          {name}
        </span>

        {/* Difficulty stars */}
        <div className="flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <StarIcon key={star} filled={star <= difficulty} />
          ))}
        </div>

        {/* Best score */}
        {bestScore !== undefined && !locked && (
          <span className="text-xs font-medium text-text-medium">
            최고 기록: {bestScore}점
          </span>
        )}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-card bg-black/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="11" width="12" height="10" rx="2" fill="#B2BEC3" />
              <path
                d="M9 11V8C9 6.34 10.34 5 12 5C13.66 5 15 6.34 15 8V11"
                stroke="#B2BEC3"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </motion.button>
  );
}

export default memo(GameCard);
