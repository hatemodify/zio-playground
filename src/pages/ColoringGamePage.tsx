import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration, UndoRedoControls } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { COLORING_CATEGORIES, pagesByCategory } from '@/data';
import type { ColoringCategory, ColoringPage } from '@/data';
import { cn } from '@/lib/cn';

const PALETTE_COLORS = [
  '#FF6B81', '#FF9F43', '#FFD93D', '#2ED573',
  '#4A90D9', '#A29BFE', '#FF9FF3', '#8B5E3C',
];

const OUTLINE = '#3A3A3A';
const BLANK = '#FFFFFF';

type Fills = Record<string, string>;
/** One paint action, enough to undo/redo it. */
interface FillAction {
  regionId: string;
  from: string | undefined;
  to: string;
}

/** Small non-interactive preview of a page for the picker grid. */
function PagePreview({ page }: { page: ColoringPage }) {
  return (
    <svg viewBox={page.viewBox} className="h-[64px] w-[64px]" aria-hidden="true">
      {page.regions.map((r) => (
        <path key={r.id} d={r.d} fill="#F1F1F1" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" fillRule="nonzero" />
      ))}
      {page.details?.map((det, i) => (
        <path
          key={i}
          d={det.d}
          fill={det.filled ? OUTLINE : 'none'}
          stroke={det.filled ? 'none' : OUTLINE}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export default function ColoringGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, finish, reset: resetGame, score, calculateStars, earnedStickers } = useGameLogic({});

  const [category, setCategory] = useState<ColoringCategory>('animals');
  const [page, setPage] = useState<ColoringPage | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [showReward, setShowReward] = useState(true);

  const [fills, setFills] = useState<Fills>({});
  const [past, setPast] = useState<FillAction[]>([]);
  const [future, setFuture] = useState<FillAction[]>([]);

  const filledCount = page ? page.regions.filter((r) => fills[r.id]).length : 0;
  const totalRegions = page?.regions.length ?? 0;

  const startWithPage = useCallback((next: ColoringPage) => {
    setPage(next);
    setShowPicker(false);
    setFills({});
    setPast([]);
    setFuture([]);
    start(1);
  }, [start]);

  const applyFill = useCallback((regionId: string) => {
    if (!page) return;
    const from = fills[regionId];
    if (from === selectedColor) return; // already this color — nothing to record

    const next = { ...fills, [regionId]: selectedColor };
    setFills(next);
    setPast((p) => [...p, { regionId, from, to: selectedColor }]);
    setFuture([]);

    const done = page.regions.every((r) => next[r.id]);
    if (done && gameState === 'playing') {
      play('confetti');
      finish(1);
    } else {
      play('drag_drop');
    }
  }, [page, fills, selectedColor, gameState, play, finish]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const action = p[p.length - 1];
      setFills((f) => {
        const copy = { ...f };
        if (action.from === undefined) delete copy[action.regionId];
        else copy[action.regionId] = action.from;
        return copy;
      });
      setFuture((fut) => [...fut, action]);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((fut) => {
      if (fut.length === 0) return fut;
      const action = fut[fut.length - 1];
      setFills((f) => ({ ...f, [action.regionId]: action.to }));
      setPast((p) => [...p, action]);
      return fut.slice(0, -1);
    });
  }, []);

  const clearFills = useCallback(() => {
    setFills({});
    setPast([]);
    setFuture([]);
  }, []);

  const handleBackToPicker = useCallback(() => {
    resetGame();
    setShowPicker(true);
    setPage(null);
  }, [resetGame]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    resetGame();
    setShowPicker(true);
    setPage(null);
  }, [resetGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;
  const pages = useMemo(() => pagesByCategory(category), [category]);

  if (gameState === 'reward') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pt-8">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          newStickers={earnedStickers}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'coloring',
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

  if (showPicker || !page) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-games">색칠하기</h2>
          <span className="text-sm font-medium text-text-medium">그림을 골라봐!</span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2">
          {COLORING_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-bold transition-all touch-manipulation',
                category === cat.key ? 'bg-games text-white shadow-button' : 'bg-games/10 text-text-medium',
              )}
              onClick={() => setCategory(cat.key)}
              aria-label={`${cat.label} 카테고리`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Page grid */}
        <div className="grid grid-cols-3 gap-3">
          {pages.map((p) => (
            <motion.button
              key={p.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-card touch-manipulation"
              onClick={() => {
                play('card_flip');
                startWithPage(p);
              }}
              whileTap={{ scale: 0.95 }}
              aria-label={`${p.name} 색칠하기`}
            >
              <PagePreview page={p} />
              <span className="text-xs font-bold text-text-dark">{p.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Mascot */}
        <div className="flex justify-center pt-2">
          <CharacterDdori expression="encouraging" size="sm" message="어떤 그림을 칠해볼까?" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="shrink-0 rounded-lg bg-games/10 px-2 py-1 text-sm font-bold text-games touch-manipulation"
            onClick={handleBackToPicker}
            aria-label="다른 그림 선택"
          >
            ← 다른 그림
          </button>
          <h2 className="truncate text-lg font-bold text-games">{page.emoji} {page.name}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UndoRedoControls
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onUndo={undo}
            onRedo={redo}
          />
          <span className="text-sm font-medium text-text-medium">{filledCount}/{totalRegions}</span>
        </div>
      </div>

      {/* Coloring canvas — tap a region to fill it */}
      <div className="flex justify-center">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-3 shadow-card">
          <svg viewBox={page.viewBox} className="h-auto w-full" style={{ touchAction: 'manipulation' }}>
            {page.regions.map((r) => (
              <path
                key={r.id}
                d={r.d}
                fill={fills[r.id] ?? BLANK}
                stroke={OUTLINE}
                strokeWidth={2.4}
                strokeLinejoin="round"
                fillRule="nonzero"
                className="cursor-pointer transition-[fill] duration-150"
                onPointerDown={() => applyFill(r.id)}
                role="button"
                aria-label={`${r.label} 칠하기`}
              />
            ))}
            {page.details?.map((det, i) => (
              <path
                key={i}
                d={det.d}
                fill={det.filled ? OUTLINE : 'none'}
                stroke={det.filled ? 'none' : OUTLINE}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap justify-center gap-2">
        {PALETTE_COLORS.map((color) => (
          <motion.button
            key={color}
            className={cn(
              'h-10 w-10 rounded-full border-2 touch-manipulation',
              selectedColor === color ? 'scale-110 border-text-dark' : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            whileTap={{ scale: 0.9 }}
            aria-label={`색상 ${color}`}
          />
        ))}
      </div>

      {/* Reset */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={clearFills}>
          다시 칠하기
        </Button>
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={filledCount > 0 ? 'happy' : 'encouraging'}
          size="sm"
          message={filledCount > 0 ? '예쁘다!' : '색을 골라 그림을 눌러봐!'}
        />
      </div>
    </div>
  );
}
