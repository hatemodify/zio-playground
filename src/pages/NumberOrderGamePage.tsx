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

interface OrderQuestion {
  sequence: number[];
  /** Index within `sequence` that is blanked out. */
  blankIndex: number;
  answer: number;
  options: number[];
  step: number;
}

const TOTAL_QUESTIONS = 10;
const SEQUENCE_LENGTH = 4;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Counting by 1s first, then skip-counting by 2s and 5s. */
function stepForQuestion(index: number, total: number): number {
  const progress = (index + 1) / total;
  if (progress <= 0.5) return 1;
  if (progress <= 0.8) return 2;
  return 5;
}

function generateQuestions(total: number): OrderQuestion[] {
  const questions: OrderQuestion[] = [];

  for (let i = 0; i < total; i += 1) {
    const step = stepForQuestion(i, total);
    const span = step * (SEQUENCE_LENGTH - 1);
    const startValue = randomInt(1, Math.max(1, NUMBERS_MAX - span));
    const sequence = Array.from({ length: SEQUENCE_LENGTH }, (_, k) => startValue + k * step);

    const blankIndex = randomInt(0, SEQUENCE_LENGTH - 1);
    const answer = sequence[blankIndex];

    // Distractors are off-by-one-step neighbours — the child has to track the rule.
    const options = new Set<number>([answer]);
    while (options.size < 3) {
      const candidate = answer + randomInt(1, 2) * step * (Math.random() < 0.5 ? -1 : 1);
      if (candidate >= 1 && candidate <= NUMBERS_MAX && candidate !== answer) {
        options.add(candidate);
      }
    }

    questions.push({
      sequence,
      blankIndex,
      answer,
      options: [...options].sort(() => Math.random() - 0.5),
      step,
    });
  }

  return questions;
}

export default function NumberOrderGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [questions, setQuestions] = useState<OrderQuestion[]>([]);
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
      speak(String(q.answer), 'ko-KR');

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
              gameId: 'number-order',
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
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">숫자 이어세기</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      <div className="text-center text-lg font-bold text-text-dark">
        {q.step === 1 ? '빈칸에 들어갈 숫자는?' : `${q.step}씩 뛰어 세고 있어요!`}
      </div>

      {/* Sequence */}
      <div className="flex items-center justify-center gap-2" role="list" aria-label="숫자 순서">
        {q.sequence.map((value, i) => {
          const isBlank = i === q.blankIndex;
          return (
            <motion.div
              key={`${currentQ}-${i}`}
              role="listitem"
              aria-label={isBlank ? '빈칸' : String(value)}
              className={cn(
                'flex h-16 flex-1 items-center justify-center rounded-2xl',
                isBlank
                  ? feedback === 'correct'
                    ? 'bg-success/15 ring-2 ring-success'
                    : 'border-2 border-dashed border-games/50 bg-games/5'
                  : 'bg-white shadow-card',
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <span
                className={cn(
                  'font-display text-2xl font-extrabold',
                  isBlank ? 'text-games' : 'text-numbers',
                )}
              >
                {isBlank ? (feedback === 'correct' ? q.answer : '?') : value}
              </span>
            </motion.div>
          );
        })}
      </div>

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
              onClick={() => handlePick(option)}
              whileTap={{ scale: 0.95 }}
              animate={{ x: isSelected && feedback === 'wrong' ? [-3, 3, -3, 3, 0] : 0 }}
              aria-label={`숫자 ${option}`}
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
            feedback === 'correct' ? '잘했어!'
              : feedback === 'wrong' ? '순서를 다시 볼까?'
                : '규칙을 찾아봐!'
          }
        />
      </div>
    </div>
  );
}
