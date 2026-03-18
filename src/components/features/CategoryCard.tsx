import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import ProgressRing from '@/components/ui/ProgressRing';
import type { LearningCategory } from '@/types/learning';
import { CATEGORY_LABELS, CATEGORY_TOTALS } from '@/types/learning';

interface CategoryCardProps {
  category: LearningCategory | 'games';
  title?: string;
  progress: number; // completed count
  total?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const categoryConfig: Record<string, { bg: string; color: string; ringColor: string; gradient: string }> = {
  numbers: {
    bg: 'bg-numbers/12',
    color: 'text-numbers',
    ringColor: 'var(--color-numbers)',
    gradient: 'from-numbers/20 to-numbers/5',
  },
  hangul: {
    bg: 'bg-hangul/12',
    color: 'text-hangul',
    ringColor: 'var(--color-hangul)',
    gradient: 'from-hangul/20 to-hangul/5',
  },
  english: {
    bg: 'bg-english/12',
    color: 'text-english',
    ringColor: 'var(--color-english)',
    gradient: 'from-english/20 to-english/5',
  },
  games: {
    bg: 'bg-games/12',
    color: 'text-games',
    ringColor: 'var(--color-games)',
    gradient: 'from-games/20 to-games/5',
  },
};

const defaultIcons: Record<string, React.ReactNode> = {
  numbers: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="24" fill="currentColor">
        123
      </text>
    </svg>
  ),
  hangul: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fontFamily="Pretendard, sans-serif" fontWeight="700" fontSize="20" fill="currentColor">
        ㄱㄴㄷ
      </text>
    </svg>
  ),
  english: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="22" fill="currentColor">
        ABC
      </text>
    </svg>
  ),
  games: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.15" />
      <rect x="12" y="16" width="24" height="16" rx="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="24" r="3" fill="currentColor" />
      <circle cx="30" cy="22" r="2" fill="currentColor" />
      <circle cx="30" cy="27" r="2" fill="currentColor" />
    </svg>
  ),
};

function CategoryCard({
  category,
  title,
  progress,
  total,
  icon,
  onClick,
  className,
}: CategoryCardProps) {
  const config = categoryConfig[category];
  const displayTitle = title ?? (category === 'games' ? '게임' : CATEGORY_LABELS[category as LearningCategory]);
  const displayTotal = total ?? (category === 'games' ? 8 : CATEGORY_TOTALS[category as LearningCategory]);
  const percentage = displayTotal > 0 ? Math.round((progress / displayTotal) * 100) : 0;

  return (
    <motion.button
      className={cn(
        'relative flex min-h-[140px] w-full flex-col items-center justify-center gap-3 overflow-hidden',
        'rounded-card p-4 shadow-card',
        'bg-gradient-to-br',
        config.gradient,
        'touch-manipulation select-none',
        'transition-shadow duration-200 hover:shadow-card-hover',
        config.color,
        className,
      )}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={`${displayTitle} - ${progress}/${displayTotal} 완료`}
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center">
        {icon ?? defaultIcons[category]}
      </div>

      {/* Title */}
      <span className="font-display text-lg font-bold text-text-dark">
        {displayTitle}
      </span>

      {/* Progress */}
      <div className="absolute right-3 top-3">
        <ProgressRing
          progress={percentage}
          size="sm"
          color={config.ringColor}
        >
          <span className="text-[9px] font-bold text-text-medium">
            {progress}/{displayTotal}
          </span>
        </ProgressRing>
      </div>
    </motion.button>
  );
}

export default memo(CategoryCard);
