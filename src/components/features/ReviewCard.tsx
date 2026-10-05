import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import type { ReviewPlan, ReviewItem, ReviewGame } from '@/lib/review-plan';
import type { LearningCategory } from '@/types/learning';

const barColor: Record<LearningCategory, string> = {
  numbers: 'bg-numbers',
  hangul: 'bg-hangul',
  english: 'bg-english',
  shapes: 'bg-shapes',
};

function daysLabel(daysAgo: number): string {
  if (daysAgo <= 1) return '어제';
  if (daysAgo < 7) return `${daysAgo}일 전`;
  return `${Math.floor(daysAgo / 7)}주 전`;
}

interface ReviewCardProps {
  plan: ReviewPlan;
  onItemClick?: (item: ReviewItem) => void;
  onGameClick?: (game: ReviewGame) => void;
  className?: string;
}

function ReviewCard({ plan, onItemClick, onGameClick, className }: ReviewCardProps) {
  if (plan.items.length === 0 && !plan.game) return null;

  return (
    <section className={cn('flex flex-col gap-3', className)} aria-label="오늘의 복습" data-testid="review-card">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-base font-bold text-text-dark">오늘의 복습</h3>
        <span className="text-xs text-text-medium">한 번 더 하면 오래 기억해요</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {plan.items.map((item, index) => (
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
            aria-label={`${item.label} 복습하기`}
          >
            <div className={cn('h-1.5 w-full', barColor[item.category])} />
            <div className="flex flex-col items-center gap-1 p-3">
              <span className={cn('text-2xl font-bold text-text-dark', item.category !== 'hangul' && 'font-display')}>{item.character}</span>
              <span className="text-xs font-medium text-text-medium">{item.label}</span>
              <span className="rounded-full bg-bg-soft px-2 text-[11px] font-semibold text-text-medium">{daysLabel(item.daysAgo)}</span>
            </div>
          </motion.button>
        ))}

        {plan.game && (
          <motion.button
            className={cn(
              'flex min-w-[150px] shrink-0 flex-col overflow-hidden rounded-radius-lg bg-white shadow-card',
              'touch-manipulation select-none transition-shadow hover:shadow-card-hover',
            )}
            onClick={() => onGameClick?.(plan.game!)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: plan.items.length * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${plan.game.name} 다시 도전하기`}
          >
            <div className="h-1.5 w-full bg-games" />
            <div className="flex flex-col items-center gap-1 p-3">
              <span className="text-sm font-bold text-text-dark">{plan.game.name}</span>
              <span className="text-base leading-none text-accent-yellow" aria-hidden="true">{'★'.repeat(plan.game.stars)}{'☆'.repeat(3 - plan.game.stars)}</span>
              <span className="rounded-full bg-games/10 px-2 text-[11px] font-semibold text-games">별 3개 도전!</span>
            </div>
          </motion.button>
        )}
      </div>
    </section>
  );
}

export default memo(ReviewCard);
