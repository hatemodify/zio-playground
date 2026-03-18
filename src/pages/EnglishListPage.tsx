import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LearningCard } from '@/components/features';
import ProgressRing from '@/components/ui/ProgressRing';
import { useProgressStore } from '@/stores/progress-store';
import { ENGLISH_DATA } from '@/data';

export default function EnglishListPage() {
  const navigate = useNavigate();
  const { getCompletionPercentage, isItemCompleted } = useProgressStore();

  const progress = getCompletionPercentage('english');
  const completedCount = Math.round(progress / 100 * 26);

  const handleCardClick = useCallback((item: typeof ENGLISH_DATA[number]) => {
    navigate(`/english/${item.uppercase}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-english">영어 놀이</h1>
        <ProgressRing progress={progress} size="sm" color="var(--color-english)">
          <span className="text-[9px] font-bold text-text-medium">{completedCount}/26</span>
        </ProgressRing>
      </div>

      {/* 4-column grid */}
      <motion.div
        className="grid grid-cols-3 gap-3 landscape-tablet:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.02 } },
        }}
      >
        {ENGLISH_DATA.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <LearningCard
              character={item.uppercase}
              label={item.lowercase}
              completed={isItemCompleted(item.id)}
              category="english"
              onClick={() => handleCardClick(item)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
