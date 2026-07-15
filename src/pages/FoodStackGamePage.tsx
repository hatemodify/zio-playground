import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { INGREDIENTS, RECIPES, paletteFor, type Recipe } from '@/data';
import { cn } from '@/lib/cn';

const TOTAL_RECIPES = 5;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** One ingredient layer: emoji + name on a colored pill. */
function LayerPill({
  id,
  index,
  variant,
}: {
  id: string;
  index?: number;
  variant: 'example' | 'placed' | 'next' | 'empty';
}) {
  const ing = INGREDIENTS[id];
  const filled = variant === 'example' || variant === 'placed';
  return (
    <div
      role="listitem"
      aria-label={
        filled
          ? `${(index ?? 0) + 1}번째 ${ing.label}`
          : variant === 'next'
            ? '다음에 놓을 자리'
            : '빈 자리'
      }
      className={cn(
        'flex h-11 items-center gap-2 rounded-full px-3',
        variant === 'empty' && 'border-2 border-dashed border-games/30 bg-transparent',
        variant === 'next' && 'border-2 border-dashed border-games bg-games/10',
      )}
      style={
        variant === 'example' || variant === 'placed'
          ? { backgroundColor: ing.color }
          : undefined
      }
    >
      {typeof index === 'number' && (
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
            variant === 'next' ? 'bg-games text-white' : 'bg-white/70 text-text-dark',
          )}
        >
          {index + 1}
        </span>
      )}
      {variant === 'empty' || variant === 'next' ? (
        <span className="text-sm font-medium text-text-light">
          {variant === 'next' ? '여기!' : ''}
        </span>
      ) : (
        <>
          <span className="text-xl leading-none">{ing.emoji}</span>
          <span className="text-sm font-bold text-text-dark">{ing.label}</span>
        </>
      )}
    </div>
  );
}

export default function FoodStackGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [palette, setPalette] = useState(() => [] as ReturnType<typeof paletteFor>);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [justFinishedRecipe, setJustFinishedRecipe] = useState(false);
  const [showReward, setShowReward] = useState(true);

  const recipe = recipes[currentIdx];

  const loadRecipe = useCallback((next: Recipe) => {
    setPlaced(0);
    setWrongId(null);
    setJustFinishedRecipe(false);
    setPalette(shuffle(paletteFor(next)));
  }, []);

  const startGame = useCallback(() => {
    // Shortest recipes first so the game ramps from 4 layers up to 6.
    const chosen = [...RECIPES]
      .sort((a, b) => a.layers.length - b.layers.length)
      .slice(0, TOTAL_RECIPES);
    setRecipes(chosen);
    setCurrentIdx(0);
    loadRecipe(chosen[0]);
    start(chosen.length);
  }, [start, loadRecipe]);

  useEffect(() => {
    if (gameState === 'ready') startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = useCallback((ingredientId: string) => {
    if (!recipe || justFinishedRecipe) return;

    const expected = recipe.layers[placed];
    if (ingredientId !== expected) {
      // Wrong ingredient — nudge, but never lose the child's progress.
      setWrongId(ingredientId);
      wrongAnswer();
      setTimeout(() => setWrongId(null), 500);
      return;
    }

    const nextPlaced = placed + 1;
    setPlaced(nextPlaced);
    setWrongId(null);

    const recipeDone = nextPlaced >= recipe.layers.length;
    if (!recipeDone) {
      play('drag_drop');
      return;
    }

    // Recipe complete.
    play('confetti');
    addScore(1);
    setJustFinishedRecipe(true);

    setTimeout(() => {
      if (currentIdx + 1 >= recipes.length) {
        finish();
      } else {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        loadRecipe(recipes[nextIdx]);
      }
    }, 1400);
  }, [recipe, justFinishedRecipe, placed, wrongAnswer, play, addScore, currentIdx, recipes, finish, loadRecipe]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    reset();
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;

  const mascotMessage = useMemo(() => {
    if (justFinishedRecipe) return '완성! 잘했어!';
    if (wrongId) return '순서를 다시 볼까?';
    if (placed === 0) return '맨 위부터 시작해요!';
    return '다음 재료는 뭘까?';
  }, [justFinishedRecipe, wrongId, placed]);

  if (gameState === 'reward') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pt-8">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'food-stack',
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

  if (!recipe) return null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">음식 만들기</h2>
        <span className="text-sm font-medium text-text-medium">{currentIdx + 1} / {recipes.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentIdx / recipes.length) * 100}%` }}
        />
      </div>

      <div className="text-center text-base font-bold text-text-dark">
        {recipe.emoji} {recipe.name}를 만들어요!
      </div>

      {/* Example vs. my build, side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Example recipe */}
        <div className="flex flex-col gap-2 rounded-2xl bg-bg-soft p-3">
          <span className="text-center text-xs font-bold text-text-medium">이렇게 만들어요</span>
          <div className="flex flex-col gap-1.5" role="list" aria-label="예시 순서">
            {recipe.layers.map((id, i) => (
              <LayerPill key={`ex-${i}`} id={id} index={i} variant="example" />
            ))}
          </div>
        </div>

        {/* Child's build */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-card">
          <span className="text-center text-xs font-bold text-games">내가 만든 것</span>
          <div className="flex flex-col gap-1.5" role="list" aria-label="내가 만든 순서">
            {recipe.layers.map((id, i) => {
              const variant = i < placed ? 'placed' : i === placed ? 'next' : 'empty';
              return (
                <motion.div
                  key={`build-${currentIdx}-${i}`}
                  initial={variant === 'placed' ? { scale: 0.8, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <LayerPill id={id} index={i} variant={variant} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ingredient palette */}
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        {palette.map((ing) => (
          <motion.button
            key={ing.id}
            className={cn(
              'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl',
              'touch-manipulation select-none shadow-card transition-all',
              wrongId === ing.id ? 'ring-2 ring-error' : 'bg-white',
            )}
            style={wrongId === ing.id ? undefined : { backgroundColor: ing.color }}
            onClick={() => handleTap(ing.id)}
            whileTap={{ scale: 0.92 }}
            animate={{ x: wrongId === ing.id ? [-4, 4, -4, 4, 0] : 0 }}
            disabled={justFinishedRecipe}
            aria-label={`${ing.label} 놓기`}
          >
            <span className="text-3xl leading-none">{ing.emoji}</span>
            <span className="text-xs font-bold text-text-dark">{ing.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Completed stamp */}
      <AnimatePresence>
        {justFinishedRecipe && (
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="rounded-full bg-success/15 px-4 py-1.5 text-base font-bold text-success">
              {recipe.emoji} {recipe.name} 완성!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="flex justify-center pt-1">
        <CharacterDdori
          expression={justFinishedRecipe ? 'excited' : wrongId ? 'encouraging' : 'thinking'}
          size="sm"
          message={mascotMessage}
        />
      </div>
    </div>
  );
}
