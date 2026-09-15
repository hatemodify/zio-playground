import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LearningCard } from '@/components/features';
import ProgressRing from '@/components/ui/ProgressRing';
import { useProgressStore } from '@/stores/progress-store';
import { HANGUL_CONSONANTS, HANGUL_VOWELS } from '@/data';
import { HANGUL_SYLLABLES, HANGUL_DATA } from '@/data/hangul';
import { cn } from '@/lib/cn';

type TabType = 'consonant' | 'vowel' | 'syllable';

export default function HangulListPage() {
  const navigate = useNavigate();
  const { getCompletionPercentage, getCategoryProgress, isItemCompleted } = useProgressStore();
  const [params, setParams] = useSearchParams();
  const activeTab: TabType = params.get('tab') === 'syllable' ? 'syllable' : params.get('tab') === 'vowel' ? 'vowel' : 'consonant';
  const [vowel, setVowel] = useState('ㅏ');

  const progress = getCompletionPercentage('hangul');
  const completedCount = getCategoryProgress('hangul').completed;

  const items = activeTab === 'syllable' ? HANGUL_SYLLABLES.filter((item) => item.vowel === vowel) : activeTab === 'consonant' ? HANGUL_CONSONANTS : HANGUL_VOWELS;

  const handleCardClick = useCallback((item: typeof HANGUL_CONSONANTS[number]) => {
    navigate(`/hangul/${item.character}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hangul">한글 놀이</h1>
        <ProgressRing progress={progress} size="sm" color="var(--color-hangul)">
          <span className="text-[9px] font-bold text-text-medium">{completedCount}/{HANGUL_DATA.length}</span>
        </ProgressRing>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-2xl bg-hangul/10 p-1">
        {([
          { key: 'consonant' as TabType, label: '자음 (ㄱ-ㅎ)' },
          { key: 'vowel' as TabType, label: '모음 (ㅏ-ㅣ)' },
          { key: 'syllable' as TabType, label: '글자 (가나다)' },
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
            aria-pressed={activeTab === tab.key}
            onClick={() => setParams({ tab: tab.key })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'syllable' && <section className="hangul-composer" aria-label="모음별 글자 학습">
        <h2 className="text-lg font-extrabold text-hangul">자음과 모음이 만나 글자가 돼요</h2>
        <p className="my-2 text-sm text-slate-600">모음을 바꾸고, 아래 글자를 골라 따라 써요. 모두 140글자!</p>
        <div className="grid grid-cols-5 gap-2">{HANGUL_VOWELS.map((item) => <button key={item.id} aria-label={`${item.character} 모음 글자`} aria-pressed={vowel === item.character} className={`min-h-11 rounded-xl text-xl font-bold ${vowel === item.character ? 'bg-hangul text-white' : 'bg-white text-hangul'}`} onClick={() => setVowel(item.character)}>{item.character}</button>)}</div>
      </section>}

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
