import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GameCard } from '@/components/features';
import { useGamificationStore } from '@/stores/gamification-store';
import { GAME_CONFIGS } from '@/data';

export default function GamesListPage() {
  const navigate = useNavigate();
  const { getBestGameRecord } = useGamificationStore();

  const handleGameClick = useCallback((gameId: string) => {
    navigate(`/games/${gameId}`);
  }, [navigate]);

  const learningGames = useMemo(
    () => GAME_CONFIGS.filter((g) => g.categories.length > 0),
    [],
  );
  const arcadeGames = useMemo(
    () => GAME_CONFIGS.filter((g) => g.categories.length === 0),
    [],
  );

  const staggerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-games">미니 게임</h1>
        <span className="text-sm font-medium text-text-medium">
          {GAME_CONFIGS.length}개 게임
        </span>
      </div>

      {/* Arcade games section */}
      {arcadeGames.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-text-dark">놀이 게임</h2>
          <motion.div
            className="grid grid-cols-2 gap-3 landscape-tablet:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerVariants}
          >
            {arcadeGames.map((game) => {
              const bestRecord = getBestGameRecord(game.id);
              const bestStars = bestRecord?.stars ?? 0;
              return (
                <motion.div key={game.id} variants={itemVariants}>
                  <GameCard
                    gameId={game.id}
                    name={game.name}
                    difficulty={1}
                    bestScore={bestStars}
                    locked={false}
                    onClick={() => handleGameClick(game.id)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Learning games section */}
      <h2 className="text-lg font-bold text-text-dark">학습 게임</h2>
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={staggerVariants}
      >
        {learningGames.map((game) => {
          const bestRecord = getBestGameRecord(game.id);
          const bestStars = bestRecord?.stars ?? 0;
          return (
            <motion.div key={game.id} variants={itemVariants}>
              <GameCard
                gameId={game.id}
                name={game.name}
                difficulty={1}
                bestScore={bestStars}
                locked={false}
                onClick={() => handleGameClick(game.id)}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
