import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

const BUBBLE_COLORS = ['#FF6B81', '#4A90D9', '#2ED573', '#FFD93D', '#A29BFE', '#FF9FF3', '#FFA502', '#70A1FF'];

interface BubbleItem {
  id: string;
  character: string;
  pairId: number;
  color: string;
  x: number;
  y: number;
  matched: boolean;
}

function generateBubbles(category: LearningCategory, pairCount: number): BubbleItem[] {
  let source: string[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => n.character);
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => h.character);
  } else {
    source = ENGLISH_DATA.map((e) => e.uppercase);
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const bubbles: BubbleItem[] = [];

  shuffled.forEach((char, i) => {
    const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
    bubbles.push({
      id: `a-${i}`,
      character: char,
      pairId: i,
      color,
      x: 10 + Math.random() * 65,
      y: 5 + Math.random() * 70,
      matched: false,
    });
    bubbles.push({
      id: `b-${i}`,
      character: char,
      pairId: i,
      color,
      x: 10 + Math.random() * 65,
      y: 5 + Math.random() * 70,
      matched: false,
    });
  });

  return bubbles.sort(() => Math.random() - 0.5);
}

export default function BubbleGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const pairCount = 4;

  const startGame = useCallback(() => {
    const newBubbles = generateBubbles(category, pairCount);
    setBubbles(newBubbles);
    setSelected(null);
    setMatchedCount(0);
    setShowHint(false);
    start(pairCount);
  }, [category, pairCount, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBubbleClick = useCallback((bubbleId: string) => {
    const bubble = bubbles.find((b) => b.id === bubbleId);
    if (!bubble || bubble.matched) return;

    if (selected === null) {
      setSelected(bubbleId);
      play('card_flip');
      return;
    }

    if (selected === bubbleId) {
      setSelected(null);
      return;
    }

    const firstBubble = bubbles.find((b) => b.id === selected);
    if (!firstBubble) {
      setSelected(null);
      return;
    }

    if (firstBubble.pairId === bubble.pairId) {
      // Match!
      play('match_success');
      const newBubbles = bubbles.map((b) =>
        b.pairId === bubble.pairId ? { ...b, matched: true } : b
      );
      setBubbles(newBubbles);
      setSelected(null);
      addScore(1);
      const newMatchedCount = matchedCount + 1;
      setMatchedCount(newMatchedCount);

      if (newMatchedCount >= pairCount) {
        play('confetti');
        setTimeout(() => finish(), 500);
      }
    } else {
      // No match
      play('wrong');
      setSelected(null);
    }
  }, [bubbles, selected, play, addScore, matchedCount, pairCount, finish]);

  const handleHint = useCallback(() => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1500);
  }, []);

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
              gameId: 'bubble',
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
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">버블 매칭</h2>
        <span className="text-sm font-medium text-text-medium">{matchedCount}/{pairCount} 쌍</span>
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

      {/* Bubble area */}
      <div className="relative h-[380px] overflow-hidden rounded-3xl bg-gradient-to-b from-cyan-50 to-blue-50">
        <AnimatePresence>
          {bubbles.map((bubble) => {
            if (bubble.matched) return null;
            const isSelected = selected === bubble.id;
            const isHintHighlight = showHint && selected && bubbles.find((b) => b.id === selected)?.pairId === bubble.pairId;

            return (
              <motion.button
                key={bubble.id}
                className="absolute touch-manipulation select-none"
                style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: [0, -8, 0, 8, 0],
                }}
                exit={{ scale: [1, 1.3, 0], opacity: 0 }}
                transition={{
                  scale: { duration: 0.3 },
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 2 },
                }}
                onClick={() => handleBubbleClick(bubble.id)}
                whileTap={{ scale: 0.85 }}
              >
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill={bubble.color}
                    opacity="0.75"
                    stroke={isSelected ? '#333' : isHintHighlight ? '#FFD93D' : 'transparent'}
                    strokeWidth={isSelected || isHintHighlight ? 3 : 0}
                  />
                  <circle cx="22" cy="22" r="6" fill="white" opacity="0.4" />
                  <text
                    x="32"
                    y="36"
                    textAnchor="middle"
                    fontFamily="Nunito, Pretendard Variable, sans-serif"
                    fontWeight="800"
                    fontSize="20"
                    fill="white"
                  >
                    {bubble.character}
                  </text>
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Hint button */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={handleHint} disabled={showHint}>
          힌트 보기
        </Button>
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={matchedCount > 0 ? 'happy' : 'encouraging'}
          size="sm"
          message={matchedCount === 0 ? '같은 글자 버블을 찾아봐!' : `${matchedCount}쌍 찾았어!`}
        />
      </div>
    </div>
  );
}
