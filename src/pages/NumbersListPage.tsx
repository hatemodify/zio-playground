import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LearningCard } from '@/components/features';
import ProgressRing from '@/components/ui/ProgressRing';
import { useProgressStore } from '@/stores/progress-store';
import { NUMBERS_DATA } from '@/data';

export default function NumbersListPage() {
  const navigate = useNavigate();
  const { getCompletionPercentage, isItemCompleted } = useProgressStore();

  const progress = getCompletionPercentage('numbers');
  const completedCount = Math.round(progress / 100 * 10);

  const handleCardClick = useCallback((item: typeof NUMBERS_DATA[number]) => {
    navigate(`/numbers/${item.number}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-numbers">숫자 놀이</h1>
        <div className="flex items-center gap-2">
          <ProgressRing progress={progress} size="sm" color="var(--color-numbers)">
            <span className="text-[9px] font-bold text-text-medium">{completedCount}/10</span>
          </ProgressRing>
        </div>
      </div>

      {/* 2-column grid */}
      <motion.div
        className="grid grid-cols-2 gap-4 landscape-tablet:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {NUMBERS_DATA.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <LearningCard
              character={item.character}
              label={item.koreanName}
              completed={isItemCompleted(item.id)}
              category="numbers"
              onClick={() => handleCardClick(item)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
