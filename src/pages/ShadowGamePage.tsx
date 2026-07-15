import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface ShadowQuestion {
  character: string;
  ttsText: string;
  ttsLang: 'ko-KR' | 'en-US';
  options: { character: string; transform: string; isCorrect: boolean }[];
}

const SHADOW_TRANSFORMS = [
  'scaleX(-1)',
  'scaleY(-1)',
  'rotate(90deg)',
  'rotate(180deg)',
  'scaleX(-1) rotate(45deg)',
];

function generateShadowQuestions(category: LearningCategory, count: number): ShadowQuestion[] {
  let source: { character: string; ttsText: string; ttsLang: 'ko-KR' | 'en-US' }[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => ({ character: n.character, ttsText: n.koreanName, ttsLang: 'ko-KR' as const }));
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => ({ character: h.character, ttsText: h.name, ttsLang: 'ko-KR' as const }));
  } else {
    source = ENGLISH_DATA.map((e) => ({ character: e.uppercase, ttsText: e.word, ttsLang: 'en-US' as const }));
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const questions: ShadowQuestion[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const item = shuffled[i];
    // Correct option has no transform (or identity)
    const correctOption = { character: item.character, transform: 'none', isCorrect: true };

    // Generate wrong options: same character but transformed
    const wrongTransforms = [...SHADOW_TRANSFORMS].sort(() => Math.random() - 0.5).slice(0, 2);
    const wrongOptions = wrongTransforms.map((t) => ({
      character: item.character,
      transform: t,
      isCorrect: false,
    }));

    const options = [correctOption, ...wrongOptions].sort(() => Math.random() - 0.5);
    questions.push({
      character: item.character,
      ttsText: item.ttsText,
      ttsLang: item.ttsLang,
      options,
    });
  }

  return questions;
}

export default function ShadowGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [questions, setQuestions] = useState<ShadowQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showReward, setShowReward] = useState(true);
  const totalQuestions = 8;

  const startGame = useCallback(() => {
    const qs = generateShadowQuestions(category, totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setFeedback(null);
    start(totalQuestions);
  }, [category, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionClick = useCallback((isCorrect: boolean) => {
    if (feedback !== null) return;

    if (isCorrect) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => setFeedback(null), 800);
    }
  }, [feedback, play, addScore, wrongAnswer, questions, currentQ, finish]);

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
              gameId: 'shadow',
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
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">그림자 맞추기</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
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

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      {/* Target character */}
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-sm font-medium text-text-medium">이 글자의 그림자를 찾아보세요!</span>
        <motion.div
          className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-card"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          key={currentQ}
        >
          <span className="font-display text-5xl font-bold text-games">{currentQuestion.character}</span>
        </motion.div>
      </div>

      {/* Shadow options */}
      <div className="flex justify-center gap-4">
        {currentQuestion.options.map((option, i) => (
          <motion.button
            key={`${currentQ}-${i}`}
            className={cn(
              'flex h-24 w-24 items-center justify-center rounded-2xl',
              'touch-manipulation select-none transition-all',
              feedback === 'correct' && option.isCorrect && 'bg-success/15 ring-2 ring-success',
              feedback === 'wrong' && !option.isCorrect && 'bg-error/15',
              feedback === null && 'bg-gray-100 shadow-card hover:shadow-card-hover',
            )}
            onClick={() => handleOptionClick(option.isCorrect)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span
              className="font-display text-4xl font-bold text-gray-700"
              style={{
                transform: option.transform,
                filter: 'brightness(0) opacity(0.6)',
              }}
            >
              {option.character}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-2">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={feedback === 'correct' ? '정답이야!' : feedback === 'wrong' ? '다시 봐봐!' : '잘 살펴봐!'}
        />
      </div>
    </div>
  );
}
