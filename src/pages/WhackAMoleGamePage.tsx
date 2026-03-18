import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/cn';

const VEHICLE_EMOJIS = ['🚗', '🚌', '🚜', '✈️', '🚁', '🚂', '🚒', '🚑', '🏎️'];
const BOMB = '💣';
const GAME_DURATION = 60; // seconds
const HOLE_COUNT = 9;

interface MoleState {
  holeIndex: number;
  emoji: string;
  isBomb: boolean;
  id: number;
}

export default function WhackAMoleGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars, earnedStickers } = useGameLogic({});

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeMoles, setActiveMoles] = useState<MoleState[]>([]);
  const [whackedIds, setWhackedIds] = useState<Set<number>>(new Set());
  const [showReward, setShowReward] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'hit' | 'bomb'; holeIndex: number } | null>(null);
  const moleIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearTimeout(spawnRef.current);
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const id = ++moleIdRef.current;
    const holeIndex = Math.floor(Math.random() * HOLE_COUNT);
    const isBomb = Math.random() < 0.15;
    const emoji = isBomb ? BOMB : VEHICLE_EMOJIS[Math.floor(Math.random() * VEHICLE_EMOJIS.length)];

    const mole: MoleState = { holeIndex, emoji, isBomb, id };
    setActiveMoles((prev) => [...prev.filter((m) => m.holeIndex !== holeIndex), mole]);

    // Auto-hide after 0.8-1.5s
    const hideDelay = 1500 + Math.random() * 700;
    setTimeout(() => {
      setActiveMoles((prev) => prev.filter((m) => m.id !== id));
    }, hideDelay);

    // Schedule next spawn
    const nextDelay = 400 + Math.random() * 600;
    spawnRef.current = setTimeout(() => spawnMole(), nextDelay);
  }, []);

  const startGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    setActiveMoles([]);
    setWhackedIds(new Set());
    moleIdRef.current = 0;
    start(30); // target score for 3 stars
    gameStateRef.current = 'playing'; // Set ref immediately before async state update

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start spawning moles
    setTimeout(() => spawnMole(), 500);
  }, [start, spawnMole, clearTimers]);

  // Finish game when time runs out
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      clearTimers();
      finish();
    }
  }, [timeLeft, gameState, finish, clearTimers]);

  // Auto-start
  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWhack = useCallback((mole: MoleState) => {
    if (whackedIds.has(mole.id)) return;

    setWhackedIds((prev) => new Set([...prev, mole.id]));
    setActiveMoles((prev) => prev.filter((m) => m.id !== mole.id));

    if (mole.isBomb) {
      play('wrong');
      wrongAnswer();
      setFeedback({ type: 'bomb', holeIndex: mole.holeIndex });
    } else {
      play('balloon_pop');
      addScore(1);
      setFeedback({ type: 'hit', holeIndex: mole.holeIndex });
    }

    setTimeout(() => setFeedback(null), 400);
  }, [whackedIds, play, addScore, wrongAnswer]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    reset();
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;

  if (gameState === 'reward') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8  h-full justify-center">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          newStickers={earnedStickers}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'whack-a-mole',
              category: 'numbers',
              score,
              stars: finalStars,
              completedAt: new Date().toISOString(),
              duration: GAME_DURATION,
            });
          }}
        />
        <p className="text-xl font-bold text-text-dark">{score}마리 잡았어요!</p>
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" size="lg" onClick={handleRestart}>다시 하기</Button>
          <Button variant="primary" size="lg" onClick={() => navigate('/games')}>게임 목록</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">두더지 잡기</h2>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-games">{score}점</span>
          <span className={cn(
            'rounded-full px-3 py-1 text-sm font-bold',
            timeLeft <= 5 ? 'bg-error/15 text-error' : 'bg-games/15 text-games',
          )}>
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="mx-auto grid w-full max-w-[360px] grid-cols-3 gap-3">
        {Array.from({ length: HOLE_COUNT }, (_, i) => {
          const mole = activeMoles.find((m) => m.holeIndex === i);
          const fb = feedback?.holeIndex === i ? feedback : null;

          return (
            <motion.button
              key={i}
              className={cn(
                'relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl',
                'bg-amber-100 shadow-inner touch-manipulation select-none',
                fb?.type === 'hit' && 'bg-success/20',
                fb?.type === 'bomb' && 'bg-error/20',
              )}
              onClick={() => mole && handleWhack(mole)}
              whileTap={{ scale: 0.95 }}
              aria-label={`구멍 ${i + 1}`}
            >
              {/* Hole */}
              <div className="absolute bottom-2 h-4 w-16 rounded-full bg-amber-800/30" />

              {/* Mole/Vehicle */}
              <AnimatePresence>
                {mole && (
                  <motion.div
                    key={mole.id}
                    className="text-4xl"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {mole.emoji}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hit feedback */}
              <AnimatePresence>
                {fb?.type === 'hit' && (
                  <motion.span
                    className="absolute text-xl font-bold text-success"
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: 1.5, y: -20, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={score > 15 ? 'excited' : 'happy'}
          size="sm"
          message={gameState === 'playing' ? '빨리 잡아!' : undefined}
        />
      </div>
    </div>
  );
}
