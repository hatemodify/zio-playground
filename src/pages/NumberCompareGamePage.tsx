import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_MAX } from '@/data';
import { cn } from '@/lib/cn';

type CompareMode = 'bigger' | 'smaller';

interface CompareQuestion {
  left: number;
  right: number;
  mode: CompareMode;
  answer: number;
}

const TOTAL_QUESTIONS = 10;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateQuestions(total: number): CompareQuestion[] {
  const questions: CompareQuestion[] = [];

  for (let i = 0; i < total; i += 1) {
    // Early questions are far apart; later ones sit close together, where a child
    // has to compare the tens digit rather than just eyeball the gap.
    const closeCall = i >= total / 2;
    const left = randomInt(1, NUMBERS_MAX);
    let right = closeCall
      ? left + randomInt(1, 3) * (Math.random() < 0.5 ? -1 : 1)
      : randomInt(1, NUMBERS_MAX);

    if (right < 1) right = left + randomInt(1, 3);
    if (right > NUMBERS_MAX) right = left - randomInt(1, 3);
    if (right === left) right = left === NUMBERS_MAX ? left - 1 : left + 1;

    const mode: CompareMode = Math.random() < 0.5 ? 'bigger' : 'smaller';
    const answer = mode === 'bigger' ? Math.max(left, right) : Math.min(left, right);

    questions.push({ left, right, mode, answer });
  }

  return questions;
}

export default function NumberCompareGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [questions, setQuestions] = useState<CompareQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(true);

  const startGame = useCallback(() => {
    setQuestions(generateQuestions(TOTAL_QUESTIONS));
    setCurrentQ(0);
    setFeedback(null);
    setSelected(null);
    start(TOTAL_QUESTIONS);
  }, [start]);

  useEffect(() => {
    if (gameState === 'ready') startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = useCallback((value: number) => {
    if (feedback !== null) return;
    const q = questions[currentQ];
    setSelected(value);

    if (value === q.answer) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
          setSelected(null);
        }
      }, 1100);
    } else {
      setFeedback('wrong');
      wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
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
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pt-8">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'number-compare',
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

  const q = questions[currentQ];
  if (!q) return null;

  const prompt = q.mode === 'bigger' ? '더 큰 수를 골라보세요!' : '더 작은 수를 골라보세요!';

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">큰 수 찾기</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      {/* Prompt — the mode flips between questions, so it has to be loud */}
      <div
        className={cn(
          'rounded-2xl py-4 text-center text-lg font-bold',
          q.mode === 'bigger' ? 'bg-numbers/15 text-numbers' : 'bg-accent-orange/15 text-accent-orange',
        )}
      >
        {prompt}
      </div>

      {/* Two big cards */}
      <div className="grid grid-cols-2 gap-4">
        {[q.left, q.right].map((value, i) => {
          const isSelected = selected === value;
          return (
            <motion.button
              key={`${currentQ}-${i}`}
              className={cn(
                'flex h-36 items-center justify-center rounded-3xl',
                'touch-manipulation select-none transition-all',
                isSelected && feedback === 'correct' && 'bg-success/15 ring-4 ring-success',
                isSelected && feedback === 'wrong' && 'bg-error/15 ring-4 ring-error',
                !isSelected && 'bg-white shadow-card',
              )}
              onClick={() => handlePick(value)}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                x: isSelected && feedback === 'wrong' ? [-4, 4, -4, 4, 0] : 0,
              }}
              transition={{ delay: i * 0.08 }}
              aria-label={`숫자 ${value}`}
            >
              <span className="font-display text-6xl font-extrabold text-numbers">{value}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-2">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={
            feedback === 'correct' ? '맞았어!'
              : feedback === 'wrong' ? '문제를 다시 읽어볼까?'
                : '어느 쪽일까?'
          }
        />
      </div>
    </div>
  );
}
