import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface RecommendationItem {
  id: string;
  character: string;
  category: LearningCategory;
  label?: string;
}

interface DailyRecommendationProps {
  items: RecommendationItem[];
  onItemClick?: (item: RecommendationItem) => void;
  className?: string;
}

const categoryBarColor: Record<LearningCategory, string> = {
  numbers: 'bg-numbers',
  hangul: 'bg-hangul',
  english: 'bg-english',
};

const categoryLabel: Record<LearningCategory, string> = {
  numbers: '숫자',
  hangul: '한글',
  english: '영어',
};

function DailyRecommendation({
  items,
  onItemClick,
  className,
}: DailyRecommendationProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="px-1 text-base font-bold text-text-dark">
        오늘의 추천 학습
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            className={cn(
              'flex min-w-[120px] shrink-0 flex-col overflow-hidden rounded-radius-lg bg-white shadow-card',
              'touch-manipulation select-none transition-shadow hover:shadow-card-hover',
            )}
            onClick={() => onItemClick?.(item)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Category color bar */}
            <div className={cn('h-1.5 w-full', categoryBarColor[item.category])} />

            <div className="flex flex-col items-center gap-1.5 p-3">
              {/* Character */}
              <span className="font-display text-2xl font-bold text-text-dark">
                {item.character}
              </span>

              {/* Label */}
              <span className="text-xs font-medium text-text-medium">
                {item.label ?? categoryLabel[item.category]}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default memo(DailyRecommendation);
