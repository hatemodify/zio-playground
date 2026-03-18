import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useTTS } from '@/hooks/use-tts';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/cn';

interface WordPuzzle {
  word: string;
  image: string;
  letters: string[];
  distractors: string[];
}

const WORD_PUZZLES: WordPuzzle[] = [
  { word: '기린', image: '🦒', letters: ['기', '린'], distractors: ['나', '다'] },
  { word: '나비', image: '🦋', letters: ['나', '비'], distractors: ['가', '라'] },
  { word: '사과', image: '🍎', letters: ['사', '과'], distractors: ['바', '하'] },
  { word: '토끼', image: '🐰', letters: ['토', '끼'], distractors: ['고', '미'] },
  { word: '바나나', image: '🍌', letters: ['바', '나', '나'], distractors: ['다', '마'] },
  { word: '오리', image: '🦆', letters: ['오', '리'], distractors: ['이', '소'] },
  { word: '포도', image: '🍇', letters: ['포', '도'], distractors: ['모', '코'] },
  { word: '하마', image: '🦛', letters: ['하', '마'], distractors: ['가', '자'] },
  { word: '코끼리', image: '🐘', letters: ['코', '끼', '리'], distractors: ['노', '비'] },
  { word: '우산', image: '☂️', letters: ['우', '산'], distractors: ['수', '안'] },
];

function getShuffledPuzzles(count: number): WordPuzzle[] {
  return [...WORD_PUZZLES].sort(() => Math.random() - 0.5).slice(0, count);
}

export default function WordBuilderGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [puzzles, setPuzzles] = useState<WordPuzzle[]>([]);
  const [currentP, setCurrentP] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ letter: string; used: boolean }[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showReward, setShowReward] = useState(true);
  const totalPuzzles = 5;

  const loadPuzzle = useCallback((puzzle: WordPuzzle) => {
    setSlots(Array(puzzle.letters.length).fill(null));
    const allLetters = [...puzzle.letters, ...puzzle.distractors].sort(() => Math.random() - 0.5);
    setAvailableLetters(allLetters.map((l) => ({ letter: l, used: false })));
    setFeedback(null);
  }, []);

  const startGame = useCallback(() => {
    const ps = getShuffledPuzzles(totalPuzzles);
    setPuzzles(ps);
    setCurrentP(0);
    start(totalPuzzles);
    if (ps[0]) loadPuzzle(ps[0]);
  }, [start, loadPuzzle]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLetterClick = useCallback((letterIndex: number) => {
    if (feedback !== null) return;
    const letterItem = availableLetters[letterIndex];
    if (letterItem.used) return;

    const puzzle = puzzles[currentP];
    if (!puzzle) return;

    // Find first empty slot
    const emptySlotIndex = slots.findIndex((s) => s === null);
    if (emptySlotIndex === -1) return;

    const newSlots = [...slots];
    newSlots[emptySlotIndex] = letterItem.letter;
    setSlots(newSlots);

    const newAvailable = [...availableLetters];
    newAvailable[letterIndex] = { ...newAvailable[letterIndex], used: true };
    setAvailableLetters(newAvailable);

    play('drag_drop');

    // Check if all slots filled
    if (newSlots.every((s) => s !== null)) {
      const formed = newSlots.join('');
      if (formed === puzzle.word) {
        setFeedback('correct');
        play('correct');
        addScore(1);
        speak(puzzle.word, 'ko-KR');

        setTimeout(() => {
          if (currentP + 1 >= puzzles.length) {
            finish();
          } else {
            setCurrentP((c) => c + 1);
            loadPuzzle(puzzles[currentP + 1]);
          }
        }, 1500);
      } else {
        setFeedback('wrong');
        play('wrong');
        wrongAnswer();
        setTimeout(() => {
          // Reset this puzzle
          loadPuzzle(puzzle);
        }, 1000);
      }
    }
  }, [feedback, availableLetters, slots, puzzles, currentP, play, addScore, wrongAnswer, finish, speak, loadPuzzle]);

  const handleSlotClick = useCallback((slotIndex: number) => {
    if (feedback !== null) return;
    const letter = slots[slotIndex];
    if (letter === null) return;

    // Remove letter from slot, put it back
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);

    const letterIdx = availableLetters.findIndex((a) => a.used && a.letter === letter);
    if (letterIdx !== -1) {
      const newAvailable = [...availableLetters];
      newAvailable[letterIdx] = { ...newAvailable[letterIdx], used: false };
      setAvailableLetters(newAvailable);
    }
  }, [feedback, slots, availableLetters]);

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
              gameId: 'word-builder',
              category: 'hangul',
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

  const currentPuzzle = puzzles[currentP];
  if (!currentPuzzle) return null;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">단어 만들기</h2>
        <span className="text-sm font-medium text-text-medium">{currentP + 1} / {puzzles.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentP / puzzles.length) * 100}%` }}
        />
      </div>

      {/* Image hint */}
      <div className="flex flex-col items-center gap-2 py-4">
        <motion.span
          className="text-7xl"
          key={currentP}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          {currentPuzzle.image}
        </motion.span>
        <span className="text-sm font-medium text-text-medium">이 그림의 이름을 만들어 보세요!</span>
      </div>

      {/* Slots */}
      <div className="flex justify-center gap-3">
        {slots.map((slot, i) => (
          <motion.button
            key={i}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl border-2',
              'touch-manipulation select-none transition-all',
              slot
                ? feedback === 'correct'
                  ? 'border-success bg-success/10'
                  : feedback === 'wrong'
                    ? 'border-error bg-error/10'
                    : 'border-games bg-games/10'
                : 'border-dashed border-text-light bg-white',
            )}
            onClick={() => handleSlotClick(i)}
            whileTap={{ scale: 0.95 }}
          >
            {slot && (
              <span className="font-display text-2xl font-bold text-text-dark">{slot}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap justify-center gap-2 pt-4">
        {availableLetters.map((item, i) => (
          <motion.button
            key={`${item.letter}-${i}`}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl shadow-card',
              'touch-manipulation select-none transition-all',
              item.used ? 'invisible' : 'bg-white text-games hover:shadow-card-hover',
            )}
            onClick={() => handleLetterClick(i)}
            whileTap={{ scale: 0.9 }}
            layout
          >
            <span className="font-display text-xl font-bold">{item.letter}</span>
          </motion.button>
        ))}
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-2">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'thinking'}
          size="sm"
          message={feedback === 'correct' ? '맞았어!' : feedback === 'wrong' ? '다시 해보자!' : '글자를 골라봐!'}
        />
      </div>
    </div>
  );
}
