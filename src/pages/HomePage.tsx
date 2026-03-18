import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CategoryCard, StreakBanner, DailyRecommendation, CharacterDdori } from '@/components/features';
import { useProgressStore } from '@/stores/progress-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_DATA, ENGLISH_DATA } from '@/data';
import type { LearningCategory } from '@/types/learning';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '좋은 아침!';
  if (hour < 18) return '신나는 오후!';
  return '오늘도 잘했어!';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { getCompletionPercentage } = useProgressStore();
  const { streak } = useGamificationStore();
  const nickname = useProgressStore((s) => s.nickname);

  const numbersProgress = Math.round(getCompletionPercentage('numbers') / 100 * 10);
  const hangulProgress = Math.round(getCompletionPercentage('hangul') / 100 * 24);
  const englishProgress = Math.round(getCompletionPercentage('english') / 100 * 26);

  const recommendations = useMemo(() => {
    const items: { id: string; character: string; category: LearningCategory; label?: string }[] = [];
    const progressItems = useProgressStore.getState().items;

    for (const num of NUMBERS_DATA) {
      if (!progressItems[num.id]?.completed) {
        items.push({ id: num.id, character: num.character, category: 'numbers', label: num.koreanName });
      }
    }
    for (const h of HANGUL_DATA) {
      if (!progressItems[h.id]?.completed) {
        items.push({ id: h.id, character: h.character, category: 'hangul', label: h.representativeWord });
      }
    }
    for (const e of ENGLISH_DATA) {
      if (!progressItems[e.id]?.completed) {
        items.push({ id: e.id, character: e.character, category: 'english', label: e.word });
      }
    }

    // Shuffle and take up to 5
    const shuffled = items.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

  const handleCategoryClick = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const handleRecommendationClick = useCallback((item: { id: string; category: LearningCategory }) => {
    const routeMap: Record<LearningCategory, string> = {
      numbers: '/numbers',
      hangul: '/hangul',
      english: '/english',
    };
    const charId = item.id.split('-').slice(1).join('-');
    navigate(`${routeMap[item.category]}/${charId}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Greeting + Mascot */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CharacterDdori expression="happy" size="md" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-text-dark">{getGreeting()}</span>
          <span className="text-base text-text-medium">
            {nickname ? `${nickname}아, ` : ''}오늘도 같이 놀자!
          </span>
        </div>
      </motion.div>

      {/* Streak Banner */}
      <StreakBanner streak={streak} />

      {/* Category Cards - 2x2 Grid, landscape 4-col */}
      <motion.div
        className="grid grid-cols-2 gap-3 landscape-tablet:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          { category: 'numbers' as const, progress: numbersProgress, route: '/numbers' },
          { category: 'hangul' as const, progress: hangulProgress, route: '/hangul' },
          { category: 'english' as const, progress: englishProgress, route: '/english' },
          { category: 'games' as const, progress: 0, route: '/games' },
        ].map((item) => (
          <motion.div
            key={item.category}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <CategoryCard
              category={item.category}
              progress={item.progress}
              onClick={() => handleCategoryClick(item.route)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Sticker Book Shortcut */}
      <motion.button
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 to-pink-100 p-4 shadow-card touch-manipulation"
        onClick={() => navigate('/stickers')}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-3xl">🎨</span>
        <div className="flex flex-col items-start">
          <span className="text-base font-bold text-text-dark">스티커북</span>
          <span className="text-xs text-text-medium">모은 스티커를 확인해 보세요!</span>
        </div>
        <svg className="ml-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>

      {/* Daily Recommendation */}
      {recommendations.length > 0 && (
        <DailyRecommendation
          items={recommendations}
          onItemClick={handleRecommendationClick}
        />
      )}
    </div>
  );
}
