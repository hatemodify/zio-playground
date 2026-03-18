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

export default function SortingGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, finish, reset, score, calculateStars } = useGameLogic({});

  const [category] = useState<LearningCategory>('numbers');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [orderedItems, setOrderedItems] = useState<{ character: string; label: string }[]>([]);
  const [shuffledItems, setShuffledItems] = useState<{ character: string; label: string; placed: boolean }[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(true);
  const itemCount = 3; // Easy

  const startRound = useCallback(() => {
    // Pick a random starting position for variety
    let source: { character: string; label: string }[];
    if (category === 'numbers') {
      const startIdx = Math.floor(Math.random() * Math.max(1, NUMBERS_DATA.length - itemCount));
      source = NUMBERS_DATA.slice(startIdx, startIdx + itemCount).map((n) => ({ character: n.character, label: n.koreanName }));
    } else if (category === 'hangul') {
      const startIdx = Math.floor(Math.random() * Math.max(1, HANGUL_CONSONANTS.length - itemCount));
      source = HANGUL_CONSONANTS.slice(startIdx, startIdx + itemCount).map((h) => ({ character: h.character, label: h.name }));
    } else {
      const startIdx = Math.floor(Math.random() * Math.max(1, ENGLISH_DATA.length - itemCount));
      source = ENGLISH_DATA.slice(startIdx, startIdx + itemCount).map((e) => ({ character: e.uppercase, label: e.word }));
    }

    setOrderedItems(source);
    setShuffledItems(source.map((s) => ({ ...s, placed: false })).sort(() => Math.random() - 0.5));
    setSlots(Array(source.length).fill(null));
    setSelectedIndex(null);
  }, [category, itemCount]);

  const startGame = useCallback(() => {
    setRound(0);
    start(totalRounds);
    startRound();
  }, [start, totalRounds, startRound]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemClick = useCallback((index: number) => {
    if (shuffledItems[index].placed) return;
    setSelectedIndex(index);
    play('drag_pickup');
  }, [shuffledItems, play]);

  const handleSlotClick = useCallback((slotIndex: number) => {
    if (selectedIndex === null || slots[slotIndex] !== null) return;

    const item = shuffledItems[selectedIndex];
    const correctChar = orderedItems[slotIndex].character;

    if (item.character === correctChar) {
      // Correct placement
      play('drag_drop');
      const newSlots = [...slots];
      newSlots[slotIndex] = item.character;
      setSlots(newSlots);

      const newShuffled = [...shuffledItems];
      newShuffled[selectedIndex] = { ...newShuffled[selectedIndex], placed: true };
      setShuffledItems(newShuffled);
      setSelectedIndex(null);

      // Check if all placed
      if (newSlots.every((s) => s !== null)) {
        play('correct');
        addScore(1);

        setTimeout(() => {
          if (round + 1 >= totalRounds) {
            finish();
          } else {
            setRound((r) => r + 1);
            startRound();
          }
        }, 800);
      }
    } else {
      // Wrong placement
      play('wrong');
      setSelectedIndex(null);
    }
  }, [selectedIndex, slots, shuffledItems, orderedItems, play, addScore, round, totalRounds, finish, startRound]);

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
              gameId: 'sorting',
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

  return (
    <div className="flex flex-col gap-6 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">순서 맞추기</h2>
        <span className="text-sm font-medium text-text-medium">
          {round + 1} / {totalRounds}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(round / totalRounds) * 100}%` }}
        />
      </div>

      {/* Drop slots */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-text-medium">올바른 순서로 놓아 보세요!</span>
        <div className="flex gap-3">
          {slots.map((slot, i) => (
            <motion.button
              key={i}
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed',
                'touch-manipulation select-none transition-all',
                slot
                  ? 'border-success bg-success/10 text-success'
                  : selectedIndex !== null
                    ? 'border-games bg-games/10'
                    : 'border-text-light bg-white',
              )}
              onClick={() => handleSlotClick(i)}
              whileTap={{ scale: 0.95 }}
            >
              {slot ? (
                <span className="font-display text-2xl font-bold">{slot}</span>
              ) : (
                <span className="text-xs text-text-light">{i + 1}</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Source items */}
      <div className="flex justify-center gap-3">
        {shuffledItems.map((item, i) => (
          <motion.button
            key={`${item.character}-${i}`}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl shadow-card',
              'touch-manipulation select-none transition-all',
              item.placed
                ? 'invisible'
                : selectedIndex === i
                  ? 'bg-games text-white ring-2 ring-games/50 scale-110'
                  : 'bg-white text-games',
            )}
            onClick={() => handleItemClick(i)}
            whileTap={{ scale: 0.9 }}
            layout
          >
            <span className="font-display text-2xl font-bold">{item.character}</span>
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={selectedIndex !== null ? 'thinking' : 'encouraging'}
          size="sm"
          message={selectedIndex !== null ? '어디에 놓을까?' : '글자를 골라봐!'}
        />
      </div>
    </div>
  );
}
