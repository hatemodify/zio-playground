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

interface OddOneOutQuestion {
  items: { character: string; category: LearningCategory; isOdd: boolean }[];
}

function generateQuestions(count: number): OddOneOutQuestion[] {
  const categorySources: Record<LearningCategory, string[]> = {
    numbers: NUMBERS_DATA.map((n) => n.character),
    hangul: HANGUL_CONSONANTS.map((h) => h.character),
    english: ENGLISH_DATA.map((e) => e.uppercase),
  };

  const categories: LearningCategory[] = ['numbers', 'hangul', 'english'];
  const questions: OddOneOutQuestion[] = [];

  for (let q = 0; q < count; q++) {
    // Pick majority category and odd category
    const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
    const majorityCat = shuffledCats[0];
    const oddCat = shuffledCats[1];

    const majorityChars = [...categorySources[majorityCat]].sort(() => Math.random() - 0.5).slice(0, 3);
    const oddChar = [...categorySources[oddCat]].sort(() => Math.random() - 0.5)[0];

    const items = [
      ...majorityChars.map((c) => ({ character: c, category: majorityCat, isOdd: false })),
      { character: oddChar, category: oddCat, isOdd: true },
    ].sort(() => Math.random() - 0.5);

    questions.push({ items });
  }

  return questions;
}

const CATEGORY_EMOJIS: Record<LearningCategory, string> = {
  numbers: '🔢',
  hangul: '가',
  english: '🔤',
};

export default function OddOneOutGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [questions, setQuestions] = useState<OddOneOutQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(true);
  const totalQuestions = 8;

  const startGame = useCallback(() => {
    const qs = generateQuestions(totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setFeedback(null);
    setSelectedIdx(null);
    start(totalQuestions);
  }, [start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemClick = useCallback((index: number) => {
    if (feedback !== null) return;

    const q = questions[currentQ];
    const item = q.items[index];
    setSelectedIdx(index);

    if (item.isOdd) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
          setSelectedIdx(null);
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelectedIdx(null);
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
              gameId: 'odd-one-out',
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
        <h2 className="text-xl font-bold text-games">짝이 아닌 것 찾기</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-lg font-bold text-text-dark">나머지와 다른 하나를 찾아보세요!</span>
      </div>

      {/* 2x2 Card grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
        {currentQuestion.items.map((item, i) => {
          const isSelected = selectedIdx === i;
          return (
            <motion.button
              key={`${currentQ}-${i}`}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl p-6',
                'touch-manipulation select-none transition-all',
                isSelected && feedback === 'correct' && 'bg-success/15 ring-2 ring-success',
                isSelected && feedback === 'wrong' && 'bg-error/15 ring-2 ring-error',
                !isSelected && 'bg-white shadow-card hover:shadow-card-hover',
              )}
              onClick={() => handleItemClick(i)}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: isSelected && feedback === 'wrong' ? [-3, 3, -3, 3, 0] : 0,
              }}
              transition={{ delay: i * 0.08, duration: feedback === 'wrong' ? 0.4 : 0.3 }}
            >
              <span className="font-display text-4xl font-bold text-games">{item.character}</span>
              <span className="text-xs text-text-light">
                {CATEGORY_EMOJIS[item.category]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-4">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={feedback === 'correct' ? '잘 찾았어!' : feedback === 'wrong' ? '다시 봐봐!' : '하나만 달라요!'}
        />
      </div>
    </div>
  );
}
