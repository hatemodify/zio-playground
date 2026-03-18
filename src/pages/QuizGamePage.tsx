import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useTTS } from '@/hooks/use-tts';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface QuizQuestion {
  answer: { character: string; label: string };
  options: { character: string; label: string }[];
  ttsText: string;
  ttsLang: 'ko-KR' | 'en-US';
}

function generateQuestions(category: LearningCategory, count: number): QuizQuestion[] {
  let source: { character: string; label: string; ttsText: string; ttsLang: 'ko-KR' | 'en-US' }[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => ({ character: n.character, label: n.koreanName, ttsText: n.koreanName, ttsLang: 'ko-KR' as const }));
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => ({ character: h.character, label: h.name, ttsText: h.name, ttsLang: 'ko-KR' as const }));
  } else {
    source = ENGLISH_DATA.map((e) => ({ character: e.uppercase, label: e.word, ttsText: e.word, ttsLang: 'en-US' as const }));
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const answer = shuffled[i];
    const others = source.filter((s) => s.character !== answer.character).sort(() => Math.random() - 0.5).slice(0, 2);
    const options = [answer, ...others].sort(() => Math.random() - 0.5);
    questions.push({
      answer: { character: answer.character, label: answer.label },
      options: options.map((o) => ({ character: o.character, label: o.label })),
      ttsText: answer.ttsText,
      ttsLang: answer.ttsLang,
    });
  }
  return questions;
}

export default function QuizGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars, earnedStickers } = useGameLogic({});

  const [category] = useState<LearningCategory>('numbers');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showReward, setShowReward] = useState(true);

  const totalQuestions = 10;

  const startGame = useCallback(() => {
    const qs = generateQuestions(category, totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setSelectedOption(null);
    setIsCorrect(null);
    start(totalQuestions);
  }, [category, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play TTS for current question
  const [ttsAutoFailed, setTtsAutoFailed] = useState(false);
  useEffect(() => {
    if (gameState === 'playing' && questions[currentQ] && isCorrect === null) {
      const q = questions[currentQ];
      setTtsAutoFailed(false);
      speak(q.ttsText, q.ttsLang).catch(() => setTtsAutoFailed(true));
    }
  }, [currentQ, gameState, questions, speak, isCorrect]);

  const handleOptionClick = useCallback((optionChar: string) => {
    if (isCorrect !== null) return;

    const q = questions[currentQ];
    setSelectedOption(optionChar);

    if (optionChar === q.answer.character) {
      setIsCorrect(true);
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        }
      }, 1000);
    } else {
      setIsCorrect(false);
      play('wrong');
      wrongAnswer();
      // Allow retry
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1200);
    }
  }, [isCorrect, questions, currentQ, play, addScore, wrongAnswer, finish]);

  const handleReplay = useCallback(() => {
    if (questions[currentQ]) {
      speak(questions[currentQ].ttsText, questions[currentQ].ttsLang);
    }
  }, [questions, currentQ, speak]);

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
              gameId: 'quiz',
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

  const currentQuestion = questions[currentQ];
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">소리 퀴즈</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${((currentQ) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Speaker button */}
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.button
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full bg-games/15 touch-manipulation',
            ttsAutoFailed && 'ring-4 ring-games/40',
          )}
          whileTap={{ scale: 0.9 }}
          onClick={handleReplay}
          aria-label="다시 듣기"
        >
          <motion.svg
            width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-games)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </motion.svg>
        </motion.button>
        <span className="text-sm text-text-medium">
          {ttsAutoFailed ? '터치해서 들어봐!' : '소리를 듣고 맞는 것을 찾아보세요!'}
        </span>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOption === option.character;

          return (
            <motion.button
              key={option.character}
              className={cn(
                'flex items-center gap-4 rounded-2xl p-4 text-left',
                'touch-manipulation select-none transition-all',
                isSelected && isCorrect === true && 'bg-success/15 ring-2 ring-success',
                isSelected && isCorrect === false && 'bg-error/15 ring-2 ring-error animate-[shake_0.4s_ease]',
                !isSelected && 'bg-white shadow-card hover:shadow-card-hover',
              )}
              onClick={() => handleOptionClick(option.character)}
              whileTap={{ scale: 0.98 }}
              animate={isSelected && isCorrect === false ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-games/10 font-display text-2xl font-bold text-games">
                {option.character}
              </span>
              <span className="text-lg font-medium text-text-dark">{option.label}</span>
              {isSelected && isCorrect === true && (
                <svg className="ml-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={isCorrect === true ? 'excited' : isCorrect === false ? 'encouraging' : 'thinking'}
          size="sm"
          message={isCorrect === true ? '정답!' : isCorrect === false ? '다시 들어볼까?' : undefined}
        />
      </div>
    </div>
  );
}
