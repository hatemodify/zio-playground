import Picture from '@/components/games/Picture';
import { PICTURE_WORDS, shuffled, type PictureId } from '@/data/picture-content';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface CardItem {
  id: string;
  content: string;
  type: 'character' | 'label';
  matchId: string;
  picture?: PictureId;
  quantity?: number;
}

function generatePairs(category: LearningCategory, pairCount: number): CardItem[] {
  const source = category === 'numbers'
    ? shuffled(Array.from({ length: 8 }, (_, i) => ({ character: String(i + 1), label: `${i + 1}개`, picture: 'apple' as PictureId, quantity: i + 1 })))
    : shuffled(PICTURE_WORDS).map((item) => ({ character: category === 'hangul' ? item.name : item.english, label: item.name, picture: item.id as PictureId, quantity: 1 }));
  return shuffled(source.slice(0, pairCount).flatMap((item, i) => [
    { id: `char-${i}`, content: item.character, type: 'character' as const, matchId: String(i) },
    { id: `label-${i}`, content: item.label, type: 'label' as const, matchId: String(i), picture: item.picture, quantity: item.quantity },
  ]));
}

export default function MatchingGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const { state: gameState, start, addScore, finish, reset, score, calculateStars, earnedStickers } = useGameLogic({ gameId: 'matching', category });
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const [moves, setMoves] = useState(0);

  const pairCount = 4; // Easy difficulty

  const startGame = useCallback(() => {
    const newCards = generatePairs(category, pairCount);
    setCards(newCards);
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setMoves(0);
    setIsChecking(false);
    start(pairCount);
  }, [category, pairCount, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  }, [gameState, startGame]);

  const handleCardClick = useCallback((cardId: string) => {
    if (isChecking || flipped.has(cardId) || matched.has(cardId)) return;

    play('card_flip');
    const newFlipped = new Set(flipped);
    newFlipped.add(cardId);
    setFlipped(newFlipped);

    const newSelected = [...selected, cardId];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const card1 = cards.find((c) => c.id === newSelected[0])!;
      const card2 = cards.find((c) => c.id === newSelected[1])!;

      if (card1.matchId === card2.matchId && card1.type !== card2.type) {
        // Match!
        setTimeout(() => {
          play('match_success');
          const newMatched = new Set(matched);
          newMatched.add(card1.id);
          newMatched.add(card2.id);
          setMatched(newMatched);
          setSelected([]);
          setIsChecking(false);
          addScore(1);

          if (newMatched.size === cards.length) {
            play('confetti');
            finish();
          }
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          play('wrong');
          setFlipped((prev) => {
            const next = new Set(prev);
            next.delete(newSelected[0]);
            next.delete(newSelected[1]);
            return next;
          });
          setSelected([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }, [isChecking, flipped, matched, selected, cards, play, addScore, finish]);

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

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">글자-이미지 매칭</h2>
        <span className="text-sm font-medium text-text-medium">시도: {moves}</span>
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

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.has(card.id) || matched.has(card.id);
          const isMatched = matched.has(card.id);

          return (
            <motion.button
              key={card.id}
              className={cn(
                'flex aspect-square items-center justify-center rounded-xl text-center',
                'touch-manipulation select-none transition-all',
                isMatched
                  ? 'bg-success/20 text-success'
                  : isFlipped
                    ? 'bg-white shadow-card'
                    : 'bg-games/15',
              )}
              onClick={() => handleCardClick(card.id)}
              whileTap={!isFlipped ? { scale: 0.95 } : undefined}
              animate={isMatched ? { scale: [1, 1.1, 0] } : { scale: 1 }}
              transition={{ duration: isMatched ? 0.4 : 0.1 }}
            >
              {isFlipped ? (
                <span className={cn(
                  'font-bold',
                  card.type === 'character' ? 'font-display text-2xl text-games' : 'text-sm text-text-dark',
                )}>
                  {card.picture ? <span className="flex flex-wrap justify-center gap-0.5" aria-label={card.content}>{Array.from({ length: card.quantity ?? 1 }, (_, i) => <Picture key={i} id={card.picture!} className={(card.quantity ?? 1) > 1 ? 'h-6 w-6 sm:h-9 sm:w-9' : 'h-16 w-16 sm:h-20 sm:w-20'} />)}</span> : card.content}
                </span>
              ) : (
                <span className="text-2xl text-games/40">?</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={matched.size > 0 ? 'happy' : 'encouraging'}
          size="sm"
          message={matched.size === 0 ? '카드를 뒤집어 봐!' : `${matched.size / 2}쌍 찾았어!`}
        />
      </div>
    </div>
  );
}
