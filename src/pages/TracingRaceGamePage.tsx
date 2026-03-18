import { useState, useCallback, useEffect, useRef } from 'react';
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

interface TracingChallenge {
  character: string;
  label: string;
}

function getChallenges(category: LearningCategory, count: number): TracingChallenge[] {
  let source: TracingChallenge[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => ({ character: n.character, label: n.koreanName }));
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => ({ character: h.character, label: h.name }));
  } else {
    source = ENGLISH_DATA.map((e) => ({ character: e.uppercase, label: e.word }));
  }
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}

export default function TracingRaceGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [challenges, setChallenges] = useState<TracingChallenge[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [showReward, setShowReward] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalQuestions = 5;

  const startGame = useCallback(() => {
    const items = getChallenges(category, totalQuestions);
    setChallenges(items);
    setCurrentIdx(0);
    setTimeLeft(10);
    setStrokes([]);
    setCurrentStroke([]);
    setFeedback(null);
    start(totalQuestions);
  }, [category, totalQuestions, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-submit
          handleSubmit();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentIdx]);

  const handleSubmit = useCallback(() => {
    // Consider it correct if they drew at least some strokes
    const hasDrawn = strokes.length > 0 || currentStroke.length > 5;
    if (hasDrawn) {
      setFeedback('correct');
      play('correct');
      addScore(1);
    } else {
      play('wrong');
    }

    setTimeout(() => {
      if (currentIdx + 1 >= totalQuestions) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      } else {
        setCurrentIdx((c) => c + 1);
        setStrokes([]);
        setCurrentStroke([]);
        setFeedback(null);
        setTimeLeft(10);
      }
    }, 600);
  }, [strokes, currentStroke, play, addScore, currentIdx, totalQuestions, finish]);

  // Canvas drawing handlers
  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentStroke([pos]);
  }, [getPos]);

  const handlePointerMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    setCurrentStroke((prev) => [...prev, pos]);
  }, [isDrawing, getPos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  }, [isDrawing, currentStroke]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide character
    ctx.font = 'bold 120px sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (challenges[currentIdx]) {
      ctx.fillText(challenges[currentIdx].character, canvas.width / 2, canvas.height / 2);
    }

    // Draw strokes
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.strokeStyle = '#FF6B81';
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, challenges, currentIdx]);

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
              gameId: 'tracing-race',
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

  if (challenges.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">따라쓰기 경주</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentIdx + 1} / {totalQuestions}
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

      {/* Timer */}
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
            timeLeft <= 3 ? 'bg-red-100 text-red-500' : 'bg-games/10 text-games',
          )}
          animate={timeLeft <= 3 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {timeLeft}
        </motion.div>
        <span className="text-sm text-text-medium">초</span>
      </div>

      {/* Target character */}
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold text-games">{challenges[currentIdx]?.character}</span>
        <span className="ml-2 text-sm text-text-medium">({challenges[currentIdx]?.label})</span>
      </div>

      {/* Canvas */}
      <div className="overflow-hidden rounded-3xl border-2 border-games/20 bg-white">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="w-full touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Submit button */}
      <Button variant="primary" size="lg" onClick={handleSubmit}>
        완성!
      </Button>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-2xl font-bold text-success">잘 썼어!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={timeLeft <= 3 ? 'encouraging' : 'happy'}
          size="sm"
          message={timeLeft <= 3 ? '서둘러!' : '따라 써봐!'}
        />
      </div>
    </div>
  );
}
