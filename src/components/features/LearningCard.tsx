import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';
import { useSettingsStore } from '@/stores/settings-store';
import { translateKorean } from '@/i18n/dom-translator';

interface LearningCardProps {
  character: string;
  label?: string;
  illustration?: React.ReactNode;
  completed?: boolean;
  category: LearningCategory;
  onClick?: () => void;
  className?: string;
}

const categoryFontConfig: Record<LearningCategory, string> = {
  numbers: 'font-display text-6xl font-extrabold',
  hangul: 'font-sans text-5xl font-bold',
  english: 'font-display text-5xl font-extrabold',
  shapes: 'font-sans text-6xl font-bold',
};

const categoryColorConfig: Record<LearningCategory, { bg: string; text: string; completedRing: string }> = {
  numbers: {
    bg: 'bg-numbers/10 hover:bg-numbers/20',
    text: 'text-numbers',
    completedRing: 'ring-numbers/40',
  },
  hangul: {
    bg: 'bg-hangul/10 hover:bg-hangul/20',
    text: 'text-hangul',
    completedRing: 'ring-hangul/40',
  },
  english: {
    bg: 'bg-english/10 hover:bg-english/20',
    text: 'text-english',
    completedRing: 'ring-english/40',
  },
  shapes: {
    bg: 'bg-shapes/10 hover:bg-shapes/20',
    text: 'text-shapes',
    completedRing: 'ring-shapes/40',
  },
};

function LearningCard({
  character,
  label,
  illustration,
  completed = false,
  category,
  onClick,
  className,
}: LearningCardProps) {
  const colors = categoryColorConfig[category];
  const language = useSettingsStore((state) => state.language);
  const accessibleLabel = `${character}${label ? ` - ${category === 'hangul' ? label : language === 'en' ? translateKorean(label) : label}` : ''}${completed ? language === 'en' ? ' (completed)' : ' (완료)' : ''}`;

  return (
    <motion.button
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center gap-2',
        'rounded-card p-4 shadow-card',
        'touch-manipulation select-none transition-all duration-200 w-full',
        colors.bg,
        completed && `ring-2 ${colors.completedRing}`,
        className,
      )}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={accessibleLabel}
    >
      {/* Completed badge */}
      {completed && (
        <div className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-success shadow-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L8.5 4.5L12.5 5L9.5 7.8L10.3 12L7 10L3.7 12L4.5 7.8L1.5 5L5.5 4.5L7 1Z"
              fill="#FFD93D"
              stroke="#E6C235"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      )}

      {/* Character */}
      <span data-i18n-ignore={category === 'hangul' ? true : undefined} className={cn(categoryFontConfig[category], colors.text)}>
        {character}
      </span>

      {/* Illustration */}
      {illustration && (
        <div className="flex h-12 w-12 items-center justify-center">
          {illustration}
        </div>
      )}

      {/* Label */}
      {label && (
        <span data-i18n-ignore={category === 'hangul' ? true : undefined} className="text-sm font-medium text-text-medium line-clamp-1">
          {label}
        </span>
      )}
    </motion.button>
  );
}

export default memo(LearningCard);
