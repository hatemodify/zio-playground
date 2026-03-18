import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
// Sound handled by useGameLogic
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface PatternQuestion {
  sequence: string[];
  answer: string;
  options: string[];
}

function generatePatternQuestions(category: LearningCategory, count: number): PatternQuestion[] {
  let chars: string[];
  if (category === 'numbers') {
    chars = NUMBERS_DATA.map((n) => n.character);
  } else if (category === 'hangul') {
    chars = HANGUL_DATA.map((h) => h.character);
  } else {
    chars = ENGLISH_DATA.map((e) => e.uppercase);
  }

  const questions: PatternQuestion[] = [];
  for (let i = 0; i < count; i++) {
    // Pick a random starting index and create a sequential pattern
    const maxStart = Math.max(0, chars.length - 5);
    const startIdx = Math.floor(Math.random() * maxStart);
    const seqLen = 3 + Math.floor(Math.random() * 2); // 3 or 4
    const sequence = chars.slice(startIdx, startIdx + seqLen);
    const answer = chars[startIdx + seqLen] ?? chars[0];

    // Generate wrong options
    const wrongOptions = chars
      .filter((c) => c !== answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);

    questions.push({ sequence, answer, options });
  }

  return questions;
}

export default function PatternGamePage() {
  const navigate = useNavigate();
  const { recordGameScore } = useGamificationStore();

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const { state, score, start, addScore, wrongAnswer, finish, calculateStars } = useGameLogic();

  const TOTAL_QUESTIONS = 8;
  const [questions, setQuestions] = useState<PatternQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showReward, setShowReward] = useState(true);

  const currentQuestion = questions[currentIdx];

  const handleStart = useCallback(() => {
    const q = generatePatternQuestions(category, TOTAL_QUESTIONS);
    setQuestions(q);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    start(TOTAL_QUESTIONS);
  }, [category, start]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);

    const correct = answer === currentQuestion?.answer;
    setIsCorrect(correct);

    if (correct) {
      addScore(1);
    } else {
      wrongAnswer();
    }

    setTimeout(() => {
      if (currentIdx < TOTAL_QUESTIONS - 1) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        finish(correct ? score + 1 : score);
      }
    }, 1000);
  }, [selectedAnswer, currentQuestion, currentIdx, score, addScore, wrongAnswer, finish]);

  const handleFinish = useCallback(() => {
    const stars = calculateStars(score);
    recordGameScore({
      gameId: 'pattern',
      category,
      score,
      stars,
      completedAt: new Date().toISOString(),
      duration: 0,
    });
    navigate('/games');
  }, [score, category, calculateStars, recordGameScore, navigate]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-games">패턴 찾기</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
          돌아가기
        </Button>
      </div>

      {state === 'ready' && (
        <motion.div
          className="flex flex-col items-center gap-6 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Category selection */}
          <div className="flex gap-2">
            {(['numbers', 'hangul', 'english'] as LearningCategory[]).map((c) => (
              <button
                key={c}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-all',
                  category === c ? 'bg-primary text-white' : 'bg-primary/10 text-primary',
                )}
                onClick={() => setCategory(c)}
              >
                {c === 'numbers' ? '숫자' : c === 'hangul' ? '한글' : '영어'}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-bg-soft p-6">
            <span className="text-6xl">🔍</span>
            <p className="text-center text-sm text-text-medium">
              순서를 보고 다음에 올 것을 맞춰보세요!
            </p>
          </div>

          <Button size="xl" onClick={handleStart}>
            시작하기
          </Button>
        </motion.div>
      )}

      {state === 'playing' && currentQuestion && (
        <motion.div
          className="flex flex-col items-center gap-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Progress */}
          <div className="flex items-center gap-2 text-sm text-text-medium">
            <span>{currentIdx + 1} / {TOTAL_QUESTIONS}</span>
            <span className="text-accent-yellow">| {score}점</span>
          </div>

          {/* Pattern sequence */}
          <div className="flex items-center gap-2">
            {currentQuestion.sequence.map((char, i) => (
              <motion.div
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {char}
              </motion.div>
            ))}
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-primary/40 text-2xl text-primary/40"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: currentQuestion.sequence.length * 0.1 }}
            >
              ?
            </motion.div>
          </div>

          {/* Options */}
          <div className="flex gap-3">
            {currentQuestion.options.map((option) => {
              let bg = 'bg-white shadow-card';
              if (selectedAnswer !== null) {
                if (option === currentQuestion.answer) {
                  bg = 'bg-success/20 shadow-card ring-2 ring-success';
                } else if (option === selectedAnswer && !isCorrect) {
                  bg = 'bg-error/20 shadow-card ring-2 ring-error';
                }
              }
              return (
                <motion.button
                  key={option}
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold transition-all touch-manipulation',
                    bg,
                  )}
                  onClick={() => handleAnswer(option)}
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {isCorrect !== null && (
              <motion.p
                className={cn('text-lg font-bold', isCorrect ? 'text-success' : 'text-error')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {isCorrect ? '정답!' : '아쉬워요!'}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {(state === 'success' || state === 'reward') && (
        <RewardCelebration
          type="game_complete"
          stars={calculateStars(score)}
          message={`${score}문제 맞았어요!`}
          open={showReward}
          onDismiss={() => { setShowReward(false); handleFinish(); }}
        />
      )}
    </div>
  );
}
