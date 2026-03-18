import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface Dot {
  id: number;
  label: string;
  x: number;
  y: number;
}

function generateDots(category: LearningCategory, count: number): Dot[] {
  let labels: string[];
  if (category === 'numbers') {
    labels = NUMBERS_DATA.slice(0, count).map((n) => n.character);
  } else if (category === 'hangul') {
    labels = HANGUL_CONSONANTS.slice(0, count).map((h) => h.character);
  } else {
    labels = ENGLISH_DATA.slice(0, count).map((e) => e.uppercase);
  }

  // Generate non-overlapping positions in a rough circle/path
  const dots: Dot[] = labels.map((label, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 100 + Math.random() * 30;
    return {
      id: i,
      label,
      x: 160 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
      y: 150 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
    };
  });

  return dots;
}

export default function ConnectDotsGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [dots, setDots] = useState<Dot[]>([]);
  const [connected, setConnected] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showReward, setShowReward] = useState(true);

  const dotCount = 5;

  const loadRound = useCallback(() => {
    setDots(generateDots(category, dotCount));
    setConnected([]);
    setFeedback(null);
  }, [category, dotCount]);

  const startGame = useCallback(() => {
    setCurrentRound(0);
    start(totalRounds);
    loadRound();
  }, [start, totalRounds, loadRound]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDotClick = useCallback((dotId: number) => {
    if (feedback !== null) return;

    const expectedNext = connected.length;

    if (dotId === expectedNext) {
      // Correct dot
      play('correct');
      const newConnected = [...connected, dotId];
      setConnected(newConnected);

      if (newConnected.length === dots.length) {
        // Round complete
        setFeedback('correct');
        play('match_success');
        addScore(1);

        setTimeout(() => {
          if (currentRound + 1 >= totalRounds) {
            finish();
          } else {
            setCurrentRound((c) => c + 1);
            loadRound();
          }
        }, 1000);
      }
    } else {
      // Wrong order
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => setFeedback(null), 600);
    }
  }, [connected, dots, feedback, play, addScore, wrongAnswer, currentRound, totalRounds, finish, loadRound]);

  const handleRestart = useCallback(() => {
    reset();
    setShowReward(true);
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;

  if (gameState === 'reward') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8  h-full justify-center">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'connect-dots',
              category,
              score,
              stars: finalStars,
              completedAt: new Date().toISOString(),
              duration: 0,
            });
          }}
        />
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" size="lg" onClick={handleRestart}>다시 하기</Button>
          <Button variant="primary" size="lg" onClick={() => navigate('/games')}>게임 목록</Button>
        </div>
      </div>
    );
  }

  if (dots.length === 0) return null;

  // Generate SVG lines for connected dots
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < connected.length; i++) {
    const from = dots[connected[i - 1]];
    const to = dots[connected[i]];
    lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">점 잇기</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentRound + 1} / {totalRounds}
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {(['numbers', 'hangul', 'english'] as LearningCategory[]).map((cat) => (
          <button
            key={cat}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-bold transition-all touch-manipulation',
              category === cat ? 'bg-games text-white shadow-button' : 'bg-games/10 text-text-medium',
            )}
            onClick={() => { setCategory(cat); reset(); }}
          >
            {cat === 'numbers' ? '숫자' : cat === 'hangul' ? '한글' : '영어'}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
        />
      </div>

      {/* Dot canvas */}
      <div className="relative h-[320px] overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-50 to-blue-50">
        {/* Connection lines */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 320">
          {lines.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#4A90D9"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </svg>

        {/* Dots */}
        {dots.map((dot) => {
          const isConnected = connected.includes(dot.id);
          const isNext = dot.id === connected.length;

          return (
            <motion.button
              key={dot.id}
              className={cn(
                'absolute flex items-center justify-center rounded-full touch-manipulation select-none',
                'h-12 w-12 -ml-6 -mt-6 text-sm font-bold',
                isConnected
                  ? 'bg-success text-white shadow-lg'
                  : isNext
                    ? 'bg-games text-white shadow-lg ring-4 ring-games/30'
                    : 'bg-white text-text-dark shadow-card border-2 border-games/20',
              )}
              style={{ left: dot.x, top: dot.y }}
              onClick={() => handleDotClick(dot.id)}
              whileTap={{ scale: 0.9 }}
              animate={isNext ? { scale: [1, 1.15, 1] } : {}}
              transition={isNext ? { duration: 1, repeat: Infinity } : undefined}
            >
              {dot.label}
            </motion.button>
          );
        })}

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="text-4xl font-bold text-success"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
              >
                완성!
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <p className="text-center text-sm text-text-medium">
        {connected.length === 0
          ? '첫 번째 점부터 순서대로 눌러보세요!'
          : `${connected.length}/${dots.length} 연결됨`}
      </p>

      {/* Feedback text */}
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-lg font-bold text-red-400">순서가 아니야!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'happy'}
          size="sm"
          message={connected.length === 0 ? '순서대로 이어봐!' : undefined}
        />
      </div>
    </div>
  );
}
