import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LearningCard } from '@/components/features';
import ProgressRing from '@/components/ui/ProgressRing';
import { useProgressStore } from '@/stores/progress-store';
import { HANGUL_CONSONANTS, HANGUL_VOWELS } from '@/data';
import { cn } from '@/lib/cn';

type TabType = 'consonant' | 'vowel';

export default function HangulListPage() {
  const navigate = useNavigate();
  const { getCompletionPercentage, isItemCompleted } = useProgressStore();
  const [activeTab, setActiveTab] = useState<TabType>('consonant');

  const progress = getCompletionPercentage('hangul');
  const completedCount = Math.round(progress / 100 * 24);

  const items = activeTab === 'consonant' ? HANGUL_CONSONANTS : HANGUL_VOWELS;

  const handleCardClick = useCallback((item: typeof HANGUL_CONSONANTS[number]) => {
    navigate(`/hangul/${item.character}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hangul">한글 놀이</h1>
        <ProgressRing progress={progress} size="sm" color="var(--color-hangul)">
          <span className="text-[9px] font-bold text-text-medium">{completedCount}/24</span>
        </ProgressRing>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-2xl bg-hangul/10 p-1">
        {([
          { key: 'consonant' as TabType, label: '자음 (ㄱ-ㅎ)' },
          { key: 'vowel' as TabType, label: '모음 (ㅏ-ㅣ)' },
        ]).map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-bold transition-all',
              'touch-manipulation select-none',
              activeTab === tab.key
                ? 'bg-hangul text-white shadow-button'
                : 'text-text-medium',
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="grid grid-cols-2 gap-4 landscape-tablet:grid-cols-3"
          initial={{ opacity: 0, x: activeTab === 'consonant' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'consonant' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <LearningCard
                character={item.character}
                label={item.representativeWord}
                completed={isItemCompleted(item.id)}
                category="hangul"
                onClick={() => handleCardClick(item)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
