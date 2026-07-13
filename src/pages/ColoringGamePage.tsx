import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration, UndoRedoControls } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { useElementSize } from '@/hooks/use-element-size';
import { useStrokeHistory, type DrawStroke } from '@/hooks/use-stroke-history';
import { SKETCHES, SKETCH_CATEGORIES } from '@/data';
import type { SketchCategory, SketchData } from '@/data';
import type { Point } from '@/types/canvas';
import { cn } from '@/lib/cn';

const PALETTE_COLORS = [
  '#FF6B81', '#FF9F43', '#FFD93D', '#2ED573',
  '#4A90D9', '#A29BFE', '#FF9FF3', '#8B5E3C',
];

/**
 * Fixed backing-store resolution. The canvas stays square — the sketch is square,
 * so a square is already the largest undistorted area — and CSS stretches it to
 * whatever the layout allows, so a resize never resamples or discards the artwork.
 */
const CANVAS_RES = 1280;
/** Reference size the sketch outline and brush widths were tuned against. */
const DESIGN_SIZE = 480;
const OUTLINE_RATIO = 2 / DESIGN_SIZE;
const BRUSH_RATIO = 20 / DESIGN_SIZE;
const BRUSH_ALPHA = 0.7;

function SketchThumbnail({ sketch }: { sketch: SketchData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 120;
    canvas.height = 120;
    ctx.clearRect(0, 0, 120, 120);
    ctx.scale(2, 2);
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    sketch.draw(ctx, 60);
  }, [sketch]);

  return <canvas ref={canvasRef} className="h-[60px] w-[60px]" />;
}

export default function ColoringGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, finish, reset: resetGame, score, calculateStars, earnedStickers } = useGameLogic({});

  const [sketchCategory, setSketchCategory] = useState<SketchCategory>('animals');
  const [selectedSketch, setSelectedSketch] = useState<SketchData | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [showReward, setShowReward] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<DrawStroke | null>(null);
  const { ref: stageRef, size: stageSize } = useElementSize<HTMLDivElement>();

  const displaySize = Math.max(0, Math.floor(Math.min(stageSize.width, stageSize.height)));

  const drawBase = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    if (!selectedSketch) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = OUTLINE_RATIO * width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    selectedSketch.draw(ctx, width);
    ctx.restore();
  }, [selectedSketch]);

  const { canUndo, canRedo, preview, commit, undo, redo, reset: resetStrokes } = useStrokeHistory({
    canvasRef,
    drawBase,
  });

  // (Re)build the canvas whenever a sketch is picked.
  useEffect(() => {
    if (!selectedSketch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_RES;
    canvas.height = CANVAS_RES;
    resetStrokes();
    setCoveragePercent(0);
  }, [selectedSketch, resetStrokes]);

  const startGameWithSketch = useCallback((sketch: SketchData) => {
    setSelectedSketch(sketch);
    setShowPicker(false);
    setCoveragePercent(0);
    start(1);
  }, [start]);

  /** Share of the canvas carrying any paint. Sampled, since a full read of 1280² is wasteful. */
  const calculateCoverage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return 0;

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const step = 4 * 4; // every 4th pixel
    let filled = 0;
    let sampled = 0;
    for (let i = 3; i < data.length; i += step) {
      if (data[i] > 50) filled += 1;
      sampled += 1;
    }
    return sampled > 0 ? (filled / sampled) * 100 : 0;
  }, []);

  const refreshCoverage = useCallback(() => {
    const coverage = calculateCoverage();
    setCoveragePercent(Math.round(coverage));
    return coverage;
  }, [calculateCoverage]);

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0,
      y: rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0,
    };
  }, []);

  const startDraw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    strokeRef.current = {
      color: selectedColor,
      widthRatio: BRUSH_RATIO,
      alpha: BRUSH_ALPHA,
      points: [getPoint(e)],
    };
    preview(strokeRef.current);
  }, [getPoint, preview, selectedColor]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    stroke.points.push(getPoint(e));
    preview(stroke);
  }, [getPoint, preview]);

  const endDraw = useCallback(() => {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    if (!stroke) return;

    commit(stroke);
    const coverage = refreshCoverage();
    if (coverage >= 8 && gameState === 'playing') {
      play('confetti');
      finish(1);
    }
  }, [commit, refreshCoverage, gameState, play, finish]);

  const handleUndo = useCallback(() => {
    undo();
    refreshCoverage();
  }, [undo, refreshCoverage]);

  const handleRedo = useCallback(() => {
    redo();
    refreshCoverage();
  }, [redo, refreshCoverage]);

  const handleClear = useCallback(() => {
    resetStrokes();
    setCoveragePercent(0);
  }, [resetStrokes]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    resetGame();
    setShowPicker(true);
    setSelectedSketch(null);
  }, [resetGame]);

  const handleBackToPicker = useCallback(() => {
    resetGame();
    setShowPicker(true);
    setSelectedSketch(null);
    setCoveragePercent(0);
  }, [resetGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;
  const filteredSketches = SKETCHES.filter(s => s.category === sketchCategory);

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

  if (showPicker) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-games">색칠하기</h2>
          <span className="text-sm font-medium text-text-medium">그림을 골라봐!</span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2">
          {SKETCH_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-bold transition-all touch-manipulation',
                sketchCategory === cat.key ? 'bg-games text-white shadow-button' : 'bg-games/10 text-text-medium',
              )}
              onClick={() => setSketchCategory(cat.key)}
              aria-label={`${cat.label} 카테고리`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Sketch grid */}
        <div className="grid grid-cols-3 gap-3">
          {filteredSketches.map((sketch) => (
            <motion.button
              key={sketch.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-card touch-manipulation"
              onClick={() => {
                play('card_flip');
                startGameWithSketch(sketch);
              }}
              whileTap={{ scale: 0.95 }}
              aria-label={`${sketch.name} 색칠하기`}
            >
              <SketchThumbnail sketch={sketch} />
              <span className="text-xs font-bold text-text-dark">{sketch.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Mascot */}
        <div className="flex justify-center pt-2">
          <CharacterDdori
            expression="encouraging"
            size="sm"
            message="어떤 그림을 칠해볼까?"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-2 pt-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="shrink-0 rounded-lg bg-games/10 px-2 py-1 text-sm font-bold text-games touch-manipulation"
            onClick={handleBackToPicker}
            aria-label="다른 그림 선택"
          >
            ← 다른 그림
          </button>
          <h2 className="truncate text-lg font-bold text-games">
            {selectedSketch?.emoji} {selectedSketch?.name}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
          <span className="text-sm font-medium text-text-medium">{coveragePercent}%</span>
        </div>
      </div>

      {/* Canvas — fills every pixel the toolbars leave behind */}
      <div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center">
        {/* Always mounted: the init effect needs the element, and unmounting on a
            transient 0-size measurement would wipe the artwork. */}
        <canvas
          ref={canvasRef}
          className="cursor-crosshair rounded-2xl bg-white shadow-card"
          style={{ width: displaySize, height: displaySize, touchAction: 'none' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
        />
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        {PALETTE_COLORS.map((color) => (
          <motion.button
            key={color}
            className={cn(
              'h-10 w-10 rounded-full border-2 touch-manipulation',
              selectedColor === color ? 'border-text-dark scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            whileTap={{ scale: 0.9 }}
            aria-label={`색상 ${color}`}
          />
        ))}
        <Button variant="ghost" size="sm" onClick={handleClear}>
          다시 칠하기
        </Button>
      </div>
    </div>
  );
}
