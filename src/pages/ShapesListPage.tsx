import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ProgressRing from '@/components/ui/ProgressRing';
import ShapeFigure from '@/components/games/ShapeFigure';
import { useProgressStore } from '@/stores/progress-store';
import { SHAPES_DATA } from '@/data';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settings-store';

export default function ShapesListPage() {
  const navigate = useNavigate();
  const language = useSettingsStore((state) => state.language);
  const { getCompletionPercentage, isItemCompleted } = useProgressStore();

  const progress = getCompletionPercentage('shapes');
  const total = SHAPES_DATA.length;
  const completedCount = Math.round((progress / 100) * total);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-shapes">도형 놀이</h1>
        <ProgressRing progress={progress} size="sm" color="var(--color-shapes)">
          <span className="text-[9px] font-bold text-text-medium">{completedCount}/{total}</span>
        </ProgressRing>
      </div>

      {/* 2-column grid; each card draws its shape in the shape's own colour. */}
      <motion.div
        className="grid grid-cols-2 gap-4 landscape-tablet:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {SHAPES_DATA.map((shape) => {
          const completed = isItemCompleted(shape.id);
          return (
            <motion.div key={shape.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <motion.button
                className={cn(
                  'relative flex aspect-square w-full flex-col items-center justify-center gap-3',
                  'rounded-card bg-shapes/10 p-4 shadow-card transition-all duration-200 hover:bg-shapes/20',
                  'touch-manipulation select-none',
                  completed && 'ring-2 ring-shapes/40',
                )}
                onClick={() => navigate(`/shapes/${shape.slug}`)}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                aria-label={language === 'en' ? `${shape.english}${completed ? ' (completed)' : ''}` : `${shape.name} - ${shape.english}${completed ? ' (완료)' : ''}`}
              >
                {completed && (
                  <div className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-success shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L8.5 4.5L12.5 5L9.5 7.8L10.3 12L7 10L3.7 12L4.5 7.8L1.5 5L5.5 4.5L7 1Z" fill="#FFD93D" stroke="#E6C235" strokeWidth="0.5" />
                    </svg>
                  </div>
                )}
                <ShapeFigure shape={shape} size={72} />
                <span className="text-base font-bold text-text-dark">{language === 'en' ? shape.english : shape.name}</span>
                {language === 'ko' && <span className="-mt-2 text-xs font-medium text-text-medium">{shape.english}</span>}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
