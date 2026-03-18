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

interface MissingCharQuestion {
  sequence: (string | null)[];
  answer: string;
  options: string[];
}

function generateQuestions(category: LearningCategory, count: number): MissingCharQuestion[] {
  let source: string[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => n.character);
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => h.character);
  } else {
    source = ENGLISH_DATA.map((e) => e.uppercase);
  }

  const questions: MissingCharQuestion[] = [];
  for (let q = 0; q < count; q++) {
    const seqLength = 4;
    const maxStart = Math.max(0, source.length - seqLength);
    const startIdx = Math.floor(Math.random() * (maxStart + 1));
    const fullSequence = source.slice(startIdx, startIdx + seqLength);
    if (fullSequence.length < seqLength) continue;

    const missingIdx = Math.floor(Math.random() * seqLength);
    const answer = fullSequence[missingIdx];
    const sequence = fullSequence.map((c, i) => (i === missingIdx ? null : c));

    // Generate distractors
    const others = source.filter((c) => c !== answer).sort(() => Math.random() - 0.5).slice(0, 2);
    const options = [answer, ...others].sort(() => Math.random() - 0.5);

    questions.push({ sequence, answer, options });
  }
  return questions;
}

export default function MissingCharGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [questions, setQuestions] = useState<MissingCharQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(true);
  const totalQuestions = 8;

  const startGame = useCallback(() => {
    const qs = generateQuestions(category, totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setFeedback(null);
    setSelectedOption(null);
    start(totalQuestions);
  }, [category, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionClick = useCallback((option: string) => {
    if (feedback !== null) return;

    const q = questions[currentQ];
    setSelectedOption(option);

    if (option === q.answer) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= questions.length) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          setFeedback(null);
          setSelectedOption(null);
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
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
              gameId: 'missing-char',
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
        <h2 className="text-xl font-bold text-games">빠진 글자 찾기</h2>
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

      {/* Sequence display */}
      <div className="flex flex-col items-center gap-3 py-6">
        <span className="text-sm font-medium text-text-medium">빠진 자리에 들어갈 글자를 찾아보세요!</span>
        <div className="flex gap-3">
          {currentQuestion.sequence.map((char, i) => (
            <motion.div
              key={`${currentQ}-${i}`}
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-xl',
                char === null
                  ? 'border-2 border-dashed border-games bg-games/5'
                  : 'bg-white shadow-card',
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {char !== null ? (
                <span className="font-display text-2xl font-bold text-text-dark">{char}</span>
              ) : (
                <motion.span
                  className="text-3xl text-games"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ?
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex justify-center gap-4">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOption === option;
          return (
            <motion.button
              key={`${currentQ}-${option}`}
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-2xl',
                'touch-manipulation select-none transition-all',
                isSelected && feedback === 'correct' && 'bg-success/15 ring-2 ring-success',
                isSelected && feedback === 'wrong' && 'bg-error/15 ring-2 ring-error',
                !isSelected && 'bg-white shadow-card hover:shadow-card-hover',
              )}
              onClick={() => handleOptionClick(option)}
              whileTap={{ scale: 0.95 }}
              animate={isSelected && feedback === 'wrong' ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <span className="font-display text-3xl font-bold text-games">{option}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-4">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={feedback === 'correct' ? '맞았어!' : feedback === 'wrong' ? '다시 생각해봐!' : '순서를 잘 봐!'}
        />
      </div>
    </div>
  );
}
