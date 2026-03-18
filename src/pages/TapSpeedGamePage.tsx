import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/cn';

const GAME_DURATION = 10; // seconds

export default function TapSpeedGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, finish, reset, calculateStars } = useGameLogic({});

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [tapCount, setTapCount] = useState(0);
  const [showReward, setShowReward] = useState(true);
  const [tapScale, setTapScale] = useState(1);
  const [bestRecord, setBestRecord] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load best record from gamification store
  useEffect(() => {
    const best = useGamificationStore.getState().getBestGameRecord('tap-speed');
    if (best) setBestRecord(best.score);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    setTapCount(0);
    start(40); // target for 3 stars

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
  }, [start]);

  // Finish when time runs out
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      clearTimer();
      finish(tapCount);
    }
  }, [timeLeft, gameState, finish, clearTimer, tapCount]);

  // Auto-start
  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return;

    setTapCount((prev) => prev + 1);
    play('button_click');

    // Bounce animation
    setTapScale(0.9);
    setTimeout(() => setTapScale(1), 80);
  }, [gameState, play]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    reset();
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(tapCount) : 0;
  const isNewRecord = tapCount > bestRecord && gameState === 'reward';

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
              gameId: 'tap-speed',
              category: 'numbers',
              score: tapCount,
              stars: finalStars,
              completedAt: new Date().toISOString(),
              duration: GAME_DURATION,
            });
          }}
        />
        <p className="text-xl font-bold text-text-dark">{tapCount}번 터치!</p>
        {isNewRecord && (
          <motion.p
            className="text-lg font-bold text-success"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5 }}
          >
            새 기록!
          </motion.p>
        )}
        {bestRecord > 0 && !isNewRecord && (
          <p className="text-sm text-text-medium">최고 기록: {bestRecord}번</p>
        )}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" size="lg" onClick={handleRestart}>다시 하기</Button>
          <Button variant="primary" size="lg" onClick={() => navigate('/games')}>게임 목록</Button>
        </div>
      </div>
    );
  }

  // Countdown display color
  const countdownColor = timeLeft <= 3 ? 'text-error' : 'text-games';

  return (
    <div className="flex flex-col items-center gap-6 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-bold text-games">빠른 손</h2>
        <span className={cn(
          'rounded-full px-3 py-1 text-sm font-bold',
          timeLeft <= 3 ? 'bg-error/15 text-error' : 'bg-games/15 text-games',
        )}>
          {timeLeft}초
        </span>
      </div>

      {/* Timer arc */}
      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#E2E8F0" strokeWidth="8" />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={timeLeft <= 3 ? 'var(--color-error)' : 'var(--color-games)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - timeLeft / GAME_DURATION)}`}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className={cn('absolute text-5xl font-bold', countdownColor)}>
          {tapCount}
        </span>
      </div>

      {/* Big tap button */}
      <motion.button
        className={cn(
          'flex h-40 w-40 items-center justify-center rounded-full',
          'bg-gradient-to-br from-games to-games/70',
          'shadow-lg touch-manipulation select-none',
          'text-5xl text-white',
        )}
        style={{ transform: `scale(${tapScale})` }}
        onClick={handleTap}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        aria-label="터치 버튼"
      >
        👋
      </motion.button>

      {/* Best record */}
      {bestRecord > 0 && (
        <p className="text-sm text-text-medium">최고 기록: {bestRecord}번</p>
      )}

      {/* Mascot */}
      <CharacterDdori
        expression={tapCount > 30 ? 'excited' : tapCount > 15 ? 'happy' : 'encouraging'}
        size="sm"
        message={gameState === 'playing' ? '더 빨리!' : undefined}
      />
    </div>
  );
}
