import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
// Sound/TTS handled by useGameLogic
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface SpeedQuestion {
  text: string;
  ttsText: string;
  options: string[];
  answer: string;
}

function generateSpeedQuestions(category: LearningCategory): SpeedQuestion[] {
  const questions: SpeedQuestion[] = [];

  if (category === 'numbers') {
    for (const num of NUMBERS_DATA) {
      const wrong = NUMBERS_DATA.filter((n) => n.id !== num.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      questions.push({
        text: num.koreanName,
        ttsText: num.koreanName,
        options: [num.character, ...wrong.map((w) => w.character)].sort(() => Math.random() - 0.5),
        answer: num.character,
      });
    }
  } else if (category === 'hangul') {
    for (const h of HANGUL_DATA) {
      const wrong = HANGUL_DATA.filter((x) => x.id !== h.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      questions.push({
        text: h.name,
        ttsText: h.name,
        options: [h.character, ...wrong.map((w) => w.character)].sort(() => Math.random() - 0.5),
        answer: h.character,
      });
    }
  } else {
    for (const e of ENGLISH_DATA) {
      const wrong = ENGLISH_DATA.filter((x) => x.id !== e.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      questions.push({
        text: e.word,
        ttsText: e.uppercase,
        options: [e.uppercase, ...wrong.map((w) => w.uppercase)].sort(() => Math.random() - 0.5),
        answer: e.uppercase,
      });
    }
  }

  return questions.sort(() => Math.random() - 0.5);
}

const TIME_LIMIT = 30; // seconds

export default function SpeedQuizGamePage() {
  const navigate = useNavigate();
  const { recordGameScore } = useGamificationStore();

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const { state, score, start, addScore, wrongAnswer, finish, calculateStars } = useGameLogic();

  const [questions, setQuestions] = useState<SpeedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);

  const currentQuestion = questions[currentIdx];

  // Timer effect
  useEffect(() => {
    if (state === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            finish(scoreRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, finish]);

  const handleStart = useCallback(() => {
    const q = generateSpeedQuestions(category);
    setQuestions(q);
    setCurrentIdx(0);
    setTimeLeft(TIME_LIMIT);
    setSelectedAnswer(null);
    scoreRef.current = 0;
    start(q.length);
  }, [category, start]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);

    const correct = answer === currentQuestion?.answer;
    if (correct) {
      addScore(1);
      scoreRef.current += 1;
    } else {
      wrongAnswer();
    }

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        finish(scoreRef.current);
      }
    }, 500);
  }, [selectedAnswer, currentQuestion, currentIdx, questions.length, addScore, wrongAnswer, finish]);

  const handleFinish = useCallback(() => {
    const stars = calculateStars(score);
    recordGameScore({
      gameId: 'speed-quiz',
      category,
      score,
      stars,
      completedAt: new Date().toISOString(),
      duration: TIME_LIMIT - timeLeft,
    });
    navigate('/games');
  }, [score, category, timeLeft, calculateStars, recordGameScore, navigate]);

  const timerPercent = (timeLeft / TIME_LIMIT) * 100;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-games">빠르기 도전</h1>
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
            <span className="text-6xl">⏱️</span>
            <p className="text-lg font-bold text-text-dark">30초 도전!</p>
            <p className="text-center text-sm text-text-medium">
              시간 안에 최대한 많이 맞춰보세요!
            </p>
          </div>

          <Button size="xl" onClick={handleStart}>
            시작하기
          </Button>
        </motion.div>
      )}

      {state === 'playing' && currentQuestion && (
        <motion.div
          className="flex flex-col items-center gap-5 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Timer bar */}
          <div className="w-full overflow-hidden rounded-full bg-gray-200 h-3">
            <motion.div
              className={cn(
                'h-full rounded-full transition-colors',
                timeLeft > 10 ? 'bg-success' : timeLeft > 5 ? 'bg-accent-yellow' : 'bg-error',
              )}
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className={cn('font-display text-2xl font-bold', timeLeft <= 5 ? 'text-error' : 'text-text-dark')}>
              {timeLeft}초
            </span>
            <span className="text-accent-yellow font-bold">{score}점</span>
          </div>

          {/* Question */}
          <motion.div
            key={currentIdx}
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-xl font-bold text-text-dark">{currentQuestion.text}</p>

            <div className="flex gap-3">
              {currentQuestion.options.map((option) => {
                let bg = 'bg-white shadow-card';
                if (selectedAnswer !== null) {
                  if (option === currentQuestion.answer) {
                    bg = 'bg-success/20 ring-2 ring-success';
                  } else if (option === selectedAnswer) {
                    bg = 'bg-error/20 ring-2 ring-error';
                  }
                }
                return (
                  <motion.button
                    key={option}
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold touch-manipulation',
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
          </motion.div>
        </motion.div>
      )}

      {(state === 'success' || state === 'reward') && (
        <RewardCelebration
          type="game_complete"
          stars={calculateStars(score)}
          message={`${TIME_LIMIT}초 동안 ${score}개 맞았어요!`}
          open={showReward}
          onDismiss={() => { setShowReward(false); handleFinish(); }}
        />
      )}
    </div>
  );
}
