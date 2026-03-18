import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/cn';

const OBJECTS = ['🍎', '⭐', '🌸', '🐟', '🦋', '🎈', '🍬', '☁️', '💖', '🍊'];

interface CompareQuestion {
  left: number;
  right: number;
  answer: 'left' | 'right';
  object: string;
}

function generateQuestions(count: number): CompareQuestion[] {
  const questions: CompareQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const left = Math.floor(Math.random() * 9) + 1;
    let right = Math.floor(Math.random() * 9) + 1;
    while (left === right) {
      right = Math.floor(Math.random() * 9) + 1;
    }
    const object = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    questions.push({
      left,
      right,
      answer: left > right ? 'left' : 'right',
      object,
    });
  }
  return questions;
}

function ObjectGrid({ count, object }: { count: number; object: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="text-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring' }}
        >
          {object}
        </motion.span>
      ))}
    </div>
  );
}

export default function SizeCompareGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [questions, setQuestions] = useState<CompareQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [showReward, setShowReward] = useState(true);
  const totalQuestions = 10;

  const startGame = useCallback(() => {
    const qs = generateQuestions(totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setFeedback(null);
    setSelectedSide(null);
    start(totalQuestions);
  }, [start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSideClick = useCallback((side: 'left' | 'right') => {
    if (feedback !== null) return;

    const q = questions[currentQ];
    setSelectedSide(side);

    if (side === q.answer) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
          setSelectedSide(null);
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelectedSide(null);
      }, 800);
    }
  }, [feedback, questions, currentQ, play, addScore, wrongAnswer, finish]);

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
              gameId: 'size-compare',
              category: 'numbers',
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

  const currentQuestion = questions[currentQ];
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">크기 비교</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        <span className="text-lg font-bold text-text-dark">더 큰 쪽을 골라보세요!</span>
      </div>

      {/* Comparison cards */}
      <div className="flex items-center justify-center gap-4">
        {/* Left side */}
        <motion.button
          className={cn(
            'flex min-h-[180px] w-[140px] flex-col items-center justify-center gap-2 rounded-2xl p-3',
            'touch-manipulation select-none transition-all',
            selectedSide === 'left' && feedback === 'correct' && 'bg-success/15 ring-2 ring-success',
            selectedSide === 'left' && feedback === 'wrong' && 'bg-error/15 ring-2 ring-error',
            selectedSide !== 'left' && 'bg-white shadow-card',
          )}
          onClick={() => handleSideClick('left')}
          whileTap={{ scale: 0.97 }}
          key={`left-${currentQ}`}
        >
          <span className="font-display text-4xl font-bold text-games">{currentQuestion.left}</span>
          <ObjectGrid count={currentQuestion.left} object={currentQuestion.object} />
        </motion.button>

        {/* VS */}
        <span className="font-display text-2xl font-bold text-text-light">VS</span>

        {/* Right side */}
        <motion.button
          className={cn(
            'flex min-h-[180px] w-[140px] flex-col items-center justify-center gap-2 rounded-2xl p-3',
            'touch-manipulation select-none transition-all',
            selectedSide === 'right' && feedback === 'correct' && 'bg-success/15 ring-2 ring-success',
            selectedSide === 'right' && feedback === 'wrong' && 'bg-error/15 ring-2 ring-error',
            selectedSide !== 'right' && 'bg-white shadow-card',
          )}
          onClick={() => handleSideClick('right')}
          whileTap={{ scale: 0.97 }}
          key={`right-${currentQ}`}
        >
          <span className="font-display text-4xl font-bold text-games">{currentQuestion.right}</span>
          <ObjectGrid count={currentQuestion.right} object={currentQuestion.object} />
        </motion.button>
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-4">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={feedback === 'correct' ? '맞아! 잘했어!' : feedback === 'wrong' ? '다시 세어봐!' : '어느 쪽이 더 많을까?'}
        />
      </div>
    </div>
  );
}
