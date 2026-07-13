import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { RewardCelebration, UndoRedoControls } from '@/components/features';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSound } from '@/hooks/use-sound';
import { useElementSize } from '@/hooks/use-element-size';
import { useStrokeHistory, type DrawStroke } from '@/hooks/use-stroke-history';
import type { Point } from '@/types/canvas';
import { cn } from '@/lib/cn';

const COLORS = [
  { name: '빨강', value: '#FF6B6B' },
  { name: '주황', value: '#FF9F43' },
  { name: '노랑', value: '#FFD93D' },
  { name: '초록', value: '#2ED573' },
  { name: '파랑', value: '#4A90D9' },
  { name: '보라', value: '#A29BFE' },
  { name: '분홍', value: '#FF9FF3' },
  { name: '갈색', value: '#8B6F5E' },
  { name: '검정', value: '#2D3436' },
  { name: '흰색', value: '#FFFFFF' },
];

const BRUSH_SIZES = [4, 8, 16, 24];

/** Backing-store pixels per CSS pixel, and a ceiling so huge screens stay sane. */
const RESOLUTION = 2;
const MAX_BACKING = 2400;

export default function FreeDrawGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { addStars, recordGameScore } = useGamificationStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<DrawStroke | null>(null);
  const { ref: stageRef, size: stage } = useElementSize<HTMLDivElement>();

  const [selectedColor, setSelectedColor] = useState(COLORS[4].value);
  const [brushSize, setBrushSize] = useState(8);
  const [showReward, setShowReward] = useState(false);

  // The canvas takes the whole stage — every pixel the toolbars don't need.
  const displayWidth = Math.max(0, Math.floor(stage.width));
  const displayHeight = Math.max(0, Math.floor(stage.height));
  const factor = Math.min(
    RESOLUTION,
    MAX_BACKING / Math.max(displayWidth, displayHeight, 1),
  );
  const backingWidth = Math.round(displayWidth * factor);
  const backingHeight = Math.round(displayHeight * factor);

  const drawBase = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }, []);

  const { canUndo, canRedo, preview, commit, undo, redo, reset, repaint } = useStrokeHistory({
    canvasRef,
    drawBase,
  });

  // Resize the backing store to match the stage, then replay the strokes into it.
  // Vector history means a resize costs nothing — the drawing is never lost.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || backingWidth === 0 || backingHeight === 0) return;
    canvas.width = backingWidth;
    canvas.height = backingHeight;
    repaint();
  }, [backingWidth, backingHeight, repaint]);

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
      // Keep the brush visually `brushSize` px wide whatever the canvas measures.
      widthRatio: displayWidth > 0 ? brushSize / displayWidth : 0,
      points: [getPoint(e)],
    };
    preview(strokeRef.current);
  }, [getPoint, preview, selectedColor, brushSize, displayWidth]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    stroke.points.push(getPoint(e));
    preview(stroke);
  }, [getPoint, preview]);

  const endDraw = useCallback(() => {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    if (stroke) commit(stroke);
  }, [commit]);

  const handleComplete = useCallback(() => {
    play('confetti');
    addStars(2);
    recordGameScore({
      gameId: 'free-draw',
      category: 'numbers',
      score: 1,
      stars: 2,
      completedAt: new Date().toISOString(),
      duration: 0,
    });
    setShowReward(true);
  }, [play, addStars, recordGameScore]);

  const handleDismissReward = useCallback(() => {
    setShowReward(false);
    navigate('/games');
  }, [navigate]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-2 pt-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-games">자유 그리기</h1>
        <div className="flex items-center gap-2">
          <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
            돌아가기
          </Button>
        </div>
      </div>

      {/* Canvas — fills every pixel the toolbars leave behind */}
      <div ref={stageRef} className="min-h-0 flex-1">
        {/* Always mounted: the init effect needs the element, and unmounting on a
            transient 0-size measurement would wipe the drawing. */}
        <canvas
          ref={canvasRef}
          className="cursor-crosshair rounded-2xl bg-white shadow-card"
          style={{ width: displayWidth, height: displayHeight, touchAction: 'none' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
        />
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform touch-manipulation',
                selectedColor === color.value ? 'scale-125 border-text-dark' : 'border-gray-200',
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => setSelectedColor(color.value)}
              aria-label={color.name}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all touch-manipulation',
                brushSize === size ? 'bg-primary/20 ring-2 ring-primary' : 'bg-gray-100',
              )}
              onClick={() => setBrushSize(size)}
              aria-label={`브러시 ${size}px`}
            >
              <div className="rounded-full bg-text-dark" style={{ width: size, height: size }} />
            </button>
          ))}

          <Button variant="secondary" size="sm" onClick={reset}>
            지우기
          </Button>
          {canUndo && (
            <Button variant="primary" size="sm" onClick={handleComplete}>
              완성!
            </Button>
          )}
        </div>
      </div>

      {showReward && (
        <RewardCelebration
          type="game_complete"
          stars={2}
          message="멋진 그림이에요!"
          open={showReward}
          onDismiss={handleDismissReward}
        />
      )}
    </div>
  );
}
