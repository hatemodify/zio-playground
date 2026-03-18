import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface StreakBannerProps {
  streak: number;
  className?: string;
}

function StreakBanner({ streak, className }: StreakBannerProps) {
  if (streak <= 0) return null;

  return (
    <motion.div
      className={cn(
        'flex h-12 items-center justify-center gap-2 rounded-button',
        'bg-gradient-to-r from-accent-orange to-accent-yellow',
        'px-4 shadow-card',
        className,
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Flame icon */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C12 2 17 7 17 12C17 15.5 14.8 18 12 20C9.2 18 7 15.5 7 12C7 7 12 2 12 2Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M12 8C12 8 15 11 15 13.5C15 15 13.8 16.5 12 17.5C10.2 16.5 9 15 9 13.5C9 11 12 8 12 8Z"
            fill="#FF6348"
            fillOpacity="0.8"
          />
        </svg>
      </motion.div>

      <span className="font-display text-base font-bold text-white">
        연속 {streak}일째 학습 중!
      </span>

      {/* Bonus indicator */}
      {(streak === 3 || streak === 7 || streak >= 10) && (
        <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
          보너스!
        </span>
      )}
    </motion.div>
  );
}

export default memo(StreakBanner);
