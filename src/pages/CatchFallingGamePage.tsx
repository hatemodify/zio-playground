import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/cn';

const GOOD_ITEMS = ['⭐', '💖', '💎', '🌟', '💫'];
const BAD_ITEM = '💣';
const GAME_DURATION = 45;
const BASKET_WIDTH = 80; // px
const AREA_HEIGHT = 400; // px

interface FallingItem {
  id: number;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // px from top
  speed: number; // px per frame
  isBad: boolean;
}

export default function CatchFallingGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [basketX, setBasketX] = useState(50); // percentage
  const [items, setItems] = useState<FallingItem[]>([]);
  const [showReward, setShowReward] = useState(true);
  const [caughtEffect, setCaughtEffect] = useState<'good' | 'bad' | null>(null);

  const itemIdRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    setItems([]);
    setBasketX(50);
    itemIdRef.current = 0;
    start(30); // target for 3 stars

    // Countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Spawn items
    spawnRef.current = setInterval(() => {
      const id = ++itemIdRef.current;
      const isBad = Math.random() < 0.2;
      const emoji = isBad ? BAD_ITEM : GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
      const x = 5 + Math.random() * 85;
      const speed = 1.5 + Math.random() * 1.5;

      setItems((prev) => [...prev, { id, emoji, x, y: 0, speed, isBad }]);
    }, 800);
  }, [start]);

  // Animation loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animate = () => {
      setItems((prev) => {
        const updated: FallingItem[] = [];
        for (const item of prev) {
          const newY = item.y + item.speed;

          // Check if caught by basket (near bottom)
          if (newY >= AREA_HEIGHT - 50) {
            const basketLeft = basketX - 12;
            const basketRight = basketX + 12;
            if (item.x >= basketLeft && item.x <= basketRight) {
              // Caught!
              if (item.isBad) {
                play('wrong');
                wrongAnswer();
                setCaughtEffect('bad');
              } else {
                play('correct');
                addScore(1);
                setCaughtEffect('good');
              }
              setTimeout(() => setCaughtEffect(null), 300);
              continue; // remove item
            }
          }

          // Remove if off screen
          if (newY > AREA_HEIGHT + 20) continue;

          updated.push({ ...item, y: newY });
        }
        return updated;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, basketX, play, addScore, wrongAnswer]);

  // Finish when time runs out
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

  // Basket movement via pointer
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(8, Math.min(92, relX)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    if (areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      setBasketX(Math.max(8, Math.min(92, relX)));
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

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
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'catch-falling',
              category: 'numbers',
              score,
              stars: finalStars,
              completedAt: new Date().toISOString(),
              duration: GAME_DURATION,
            });
          }}
        />
        <p className="text-xl font-bold text-text-dark">{score}개 잡았어요!</p>
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
        <h2 className="text-xl font-bold text-games">별 잡기</h2>
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

      {/* Game area */}
      <div
        ref={areaRef}
        className={cn(
          'relative mx-auto w-full max-w-[400px] overflow-hidden rounded-3xl',
          'bg-gradient-to-b from-indigo-100 via-blue-50 to-green-50',
          'touch-none select-none',
          caughtEffect === 'good' && 'ring-4 ring-success/30',
          caughtEffect === 'bad' && 'ring-4 ring-error/30',
        )}
        style={{ height: AREA_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Falling items */}
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute text-3xl"
            style={{
              left: `${item.x}%`,
              top: item.y,
              transform: 'translateX(-50%)',
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Basket */}
        <div
          className="absolute bottom-2 flex items-center justify-center"
          style={{
            left: `${basketX}%`,
            transform: 'translateX(-50%)',
            width: BASKET_WIDTH,
          }}
        >
          <span className="text-4xl">🧺</span>
        </div>

        {/* Caught effect */}
        <AnimatePresence>
          {caughtEffect === 'good' && (
            <motion.span
              className="absolute bottom-14 left-1/2 text-2xl font-bold text-success"
              style={{ transform: 'translateX(-50%)' }}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              +1
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={score > 20 ? 'excited' : 'happy'}
          size="sm"
          message="좌우로 움직여!"
        />
      </div>
    </div>
  );
}
