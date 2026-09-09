import { shuffled } from '@/data/picture-content';
import { PictureToken } from '@/components/games/Picture';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { cn } from '@/lib/cn';

const COUNTING_EMOJIS = ['🍎', '⭐', '🥕', '🐟', '🍌', '🍇', '🐰', '🐧', '🍓', '🥦'];

interface CountingQuestion {
  emoji: string;
  count: number;
  choices: number[];
}

function generateQuestion(qIndex: number): CountingQuestion {
  const emoji = COUNTING_EMOJIS[qIndex % COUNTING_EMOJIS.length];
  const count = Math.floor(Math.random() * 9) + 1; // 1-9
  // Sample without replacement. At count=1, the old +/-2 loop had only
  // three possible values and could never produce its four choices.
  const wrong = shuffled(Array.from({ length: 10 }, (_, i) => i + 1).filter((value) => value !== count)).slice(0, 3);
  return {
    emoji,
    count,
    choices: shuffled([count, ...wrong]),
  };
}

export default function CountingGamePage() {
  const navigate = useNavigate();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars, earnedStickers } = useGameLogic({ gameId: 'counting' });
  const { play } = useSound();

  const [currentQ, setCurrentQ] = useState(0);
  const [totalQuestions] = useState(8);
  const [question, setQuestion] = useState<CountingQuestion | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showReward, setShowReward] = useState(true);

  const loadQuestion = useCallback((qIndex: number) => {
    setQuestion(generateQuestion(qIndex));
    setFeedback(null);
  }, []);

  const startGame = useCallback(() => {
    setCurrentQ(0);
    start(totalQuestions);
    loadQuestion(0);
  }, [start, totalQuestions, loadQuestion]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  }, [gameState, startGame]);

  const handleChoice = useCallback((choice: number) => {
    if (!question || feedback !== null) return;

    if (choice === question.count) {
      setFeedback('correct');
      play('correct');
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= totalQuestions) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          loadQuestion(currentQ + 1);
        }
      }, 800);
    } else {
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => setFeedback(null), 800);
    }
  }, [question, feedback, play, addScore, wrongAnswer, currentQ, totalQuestions, finish, loadQuestion]);

  const handleRestart = useCallback(() => {
    reset();
    setShowReward(true);
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;

  if (gameState === 'reward') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8  h-full justify-center">
        <RewardCelebration
          type="game_complete"
          newStickers={earnedStickers}
          stars={finalStars}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
          }}
        />
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" size="lg" onClick={handleRestart}>다시 하기</Button>
          <Button variant="primary" size="lg" onClick={() => navigate('/games')}>게임 목록</Button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  // Generate emoji grid
  const emojiGrid = Array.from({ length: question.count }, (_, i) => (
    <motion.span
      key={i}
      className="text-3xl"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
    >
      {<PictureToken value={question.emoji} />}
    </motion.span>
  ));

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">숫자 세기</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentQ + 1} / {totalQuestions}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question area */}
      <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 p-6">
        {emojiGrid}
      </div>

      {/* Question text */}
      <p className="text-center text-lg font-bold text-text-dark">
        몇 개일까요?
      </p>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice) => (
          <motion.button
            key={choice}
            className={cn(
              'flex items-center justify-center rounded-2xl py-5 text-2xl font-bold transition-all touch-manipulation',
              feedback === 'correct' && choice === question.count
                ? 'bg-success/20 text-success'
                : feedback === 'wrong' && choice === question.count
                  ? 'bg-success/20 text-success'
                  : 'bg-white shadow-card text-text-dark',
            )}
            onClick={() => handleChoice(choice)}
            whileTap={{ scale: 0.95 }}
          >
            {choice}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className={cn(
              'text-2xl font-bold',
              feedback === 'correct' ? 'text-success' : 'text-red-400',
            )}>
              {feedback === 'correct' ? '정답!' : '다시 세어봐!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'happy'}
          size="sm"
          message={feedback === 'wrong' ? '천천히 세어봐!' : undefined}
        />
      </div>
    </div>
  );
}
