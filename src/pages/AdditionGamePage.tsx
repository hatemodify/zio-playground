import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useTTS } from '@/hooks/use-tts';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_MAX } from '@/data';
import { cn } from '@/lib/cn';

interface AdditionQuestion {
  a: number;
  b: number;
  answer: number;
  options: number[];
  /** Dots are only an aid for small sums; past this the grid stops helping. */
  showDots: boolean;
}

const TOTAL_QUESTIONS = 10;
const DOT_LIMIT = 20;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Sums start small and grow toward NUMBERS_MAX as the child progresses. */
function maxSumForQuestion(index: number, total: number): number {
  const progress = (index + 1) / total;
  if (progress <= 0.34) return 10;
  if (progress <= 0.67) return 20;
  return NUMBERS_MAX;
}

function generateQuestions(total: number): AdditionQuestion[] {
  const questions: AdditionQuestion[] = [];

  for (let i = 0; i < total; i += 1) {
    const maxSum = maxSumForQuestion(i, total);
    const answer = randomInt(2, maxSum);
    const a = randomInt(1, answer - 1);
    const b = answer - a;

    // Distractors near the answer — a child should have to actually add, not eyeball.
    const options = new Set<number>([answer]);
    while (options.size < 3) {
      const delta = randomInt(1, 3) * (Math.random() < 0.5 ? -1 : 1);
      const candidate = answer + delta;
      if (candidate >= 1 && candidate <= NUMBERS_MAX) options.add(candidate);
    }

    questions.push({
      a,
      b,
      answer,
      options: [...options].sort(() => Math.random() - 0.5),
      showDots: answer <= DOT_LIMIT,
    });
  }

  return questions;
}

function DotGroup({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex max-w-[110px] flex-wrap justify-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className={cn('h-4 w-4 rounded-full', color)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.03 }}
        />
      ))}
    </div>
  );
}

export default function AdditionGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [questions, setQuestions] = useState<AdditionQuestion[]>([]);
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

  const handleAnswer = useCallback((value: number) => {
    if (feedback !== null) return;
    const q = questions[currentQ];
    setSelected(value);

    if (value === q.answer) {
      setFeedback('correct');
      play('correct');
      addScore(1);
      speak(`${q.a} 더하기 ${q.b}는 ${q.answer}`, 'ko-KR');

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
          setSelected(null);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
      }, 800);
    }
  }, [feedback, questions, currentQ, play, addScore, wrongAnswer, finish, speak]);

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
              gameId: 'addition',
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

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">더하기 놀이</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      {/* Equation */}
      <div
        className="flex items-center justify-center gap-3 rounded-2xl bg-white p-5 shadow-card"
        role="math"
        aria-label={`${q.a} 더하기 ${q.b}는 얼마일까요?`}
      >
        <span className="font-display text-5xl font-extrabold text-numbers">{q.a}</span>
        <span className="font-display text-4xl font-bold text-text-light">+</span>
        <span className="font-display text-5xl font-extrabold text-numbers">{q.b}</span>
        <span className="font-display text-4xl font-bold text-text-light">=</span>
        <span className="font-display text-5xl font-extrabold text-games">?</span>
      </div>

      {/* Counting aid */}
      {q.showDots && (
        <div className="flex items-center justify-center gap-4 rounded-2xl bg-bg-soft p-4">
          <DotGroup count={q.a} color="bg-numbers" />
          <span className="text-2xl font-bold text-text-light">+</span>
          <DotGroup count={q.b} color="bg-accent-orange" />
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-3 gap-3">
        {q.options.map((option) => {
          const isSelected = selected === option;
          return (
            <motion.button
              key={`${currentQ}-${option}`}
              className={cn(
                'flex h-20 items-center justify-center rounded-2xl',
                'touch-manipulation select-none transition-all',
                isSelected && feedback === 'correct' && 'bg-success/15 ring-2 ring-success',
                isSelected && feedback === 'wrong' && 'bg-error/15 ring-2 ring-error',
                !isSelected && 'bg-white shadow-card',
              )}
              onClick={() => handleAnswer(option)}
              whileTap={{ scale: 0.95 }}
              animate={{ x: isSelected && feedback === 'wrong' ? [-3, 3, -3, 3, 0] : 0 }}
              aria-label={`정답 ${option}`}
            >
              <span className="font-display text-3xl font-bold text-text-dark">{option}</span>
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
            feedback === 'correct' ? '정답이야!'
              : feedback === 'wrong' ? '다시 세어볼까?'
                : '모두 몇 개일까?'
          }
        />
      </div>
    </div>
  );
}
