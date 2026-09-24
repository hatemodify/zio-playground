import { useRef, useEffect, useCallback, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { getStrokesForCharacter } from '@/data';

interface WritingCanvasProps {
  character: string;
  canvasSize?: number;
  strokeColor?: string;
  onComplete?: () => void;
  className?: string;
}

interface DrawPoint {
  x: number;
  y: number;
}

/** How long one stroke takes to draw itself, in milliseconds. */
const STROKE_MS = 600;
const GUIDE_COLOR = '#9AC4EA';
const BADGE_COLOR = '#4A90D9';

/**
 * Simple writing canvas for character practice.
 * Shows a faint reference character, lets the user draw freely,
 * and only advances when the confirm button is explicitly tapped.
 *
 * Characters with stroke data (numbers, Hangul jamo, uppercase English) also
 * get a stroke-order guide: the strokes draw themselves in order, each tagged
 * with its number. Composed syllables have no data, so they simply omit it.
 */
export default function WritingCanvas({
  character,
  canvasSize = 320,
  strokeColor = '#4A90D9',
  onComplete,
  className,
}: WritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const frameRef = useRef<number | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  // Null while the order is hidden; otherwise how many strokes' worth is drawn.
  const [revealed, setRevealed] = useState<number | null>(null);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const reducedMotion = useReducedMotion();
  const strokes = getStrokesForCharacter(character);

  // Draw faint reference character, and the stroke order over it when revealed
  const drawGuide = useCallback((progress: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // The glyph and the stroke paths are drawn from different sources and do not
    // line up, so the revealed stroke order stands in as the reference instead.
    if (progress === null) {
      ctx.globalAlpha = 0.08;
      ctx.font = `bold ${canvasSize * 0.6}px "Nunito", "Pretendard Variable", sans-serif`;
      ctx.fillStyle = '#999';
      ctx.fillText(character, canvasSize / 2, canvasSize / 2);
      ctx.globalAlpha = 1;
    }

    if (strokes && progress !== null) {
      const badge = Math.max(9, canvasSize * 0.045);
      const started = strokes
        .map((stroke, order) => ({ order, share: Math.min(1, Math.max(0, progress - order)), stroke }))
        .filter((entry) => entry.share > 0);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = Math.max(8, canvasSize * 0.03);
      const origins: DrawPoint[] = [];
      for (const { share, stroke } of started) {
        const points = stroke.points.map((point) => ({ x: point.x * canvasSize, y: point.y * canvasSize }));
        const drawn = 1 + (points.length - 1) * share;
        origins.push(points[0]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < drawn; index += 1) {
          const next = points[index];
          const previous = points[index - 1];
          // The final segment stops part-way so the line grows smoothly.
          const partial = Math.min(1, drawn - index);
          ctx.lineTo(previous.x + (next.x - previous.x) * partial, previous.y + (next.y - previous.y) * partial);
        }
        ctx.stroke();
      }

      // Badges go on last, over every line. Strokes often share a start point
      // (ㄷ, 4), so a badge landing on a taken spot slides clear of it.
      const placed: DrawPoint[] = [];
      ctx.font = `bold ${badge * 1.3}px "Nunito", "Pretendard Variable", sans-serif`;
      started.forEach(({ order }, position) => {
        const spot = { ...origins[position] };
        while (placed.some((taken) => Math.hypot(taken.x - spot.x, taken.y - spot.y) < badge * 2.4)) {
          spot.y += badge * 2.5;
        }
        spot.y = Math.min(spot.y, canvasSize - badge);
        placed.push(spot);
        ctx.beginPath();
        ctx.fillStyle = BADGE_COLOR;
        ctx.arc(spot.x, spot.y, badge, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(String(order + 1), spot.x, spot.y + badge * 0.05);
      });
    }

    ctx.restore();
  }, [character, canvasSize, dpr, strokes]);

  // Initialize canvases. Also runs when the character or the available size
  // changes: resizing a canvas wipes its pixels, so the stroke state has to go
  // back to empty along with it.
  useEffect(() => {
    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };

    setupCanvas(canvasRef.current);
    setupCanvas(overlayRef.current);
    setHasDrawn(false);
    setRevealed(null);
    drawGuide(null);
  }, [canvasSize, dpr, drawGuide]);

  // Repaint whenever the reveal advances, and stop any run-off animation frame.
  useEffect(() => { drawGuide(revealed); }, [revealed, drawGuide]);
  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  const playStrokeOrder = useCallback(() => {
    if (!strokes) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (revealed !== null) { setRevealed(null); return; }
    if (reducedMotion) { setRevealed(strokes.length); return; }

    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(strokes.length, (now - startedAt) / STROKE_MS);
      setRevealed(progress);
      if (progress < strokes.length) frameRef.current = requestAnimationFrame(step);
      else frameRef.current = null;
    };
    frameRef.current = requestAnimationFrame(step);
  }, [strokes, revealed, reducedMotion]);

  // Drawing handlers — only manages strokes, never auto-advances
  const getPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
      const rect = overlayRef.current!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    },
    [dpr],
  );

  const startDraw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      isDrawingRef.current = true;
      lastPointRef.current = getPoint(e);
      overlayRef.current?.setPointerCapture(e.pointerId);
    },
    [getPoint],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !lastPointRef.current) return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      const point = getPoint(e);
      ctx.strokeStyle = strokeColor;
      // Scale the nib with the canvas so a bigger sheet keeps the same look.
      ctx.lineWidth = Math.max(10, canvasSize * 0.0375) * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPointRef.current = point;
      if (!hasDrawn) setHasDrawn(true);
    },
    [getPoint, strokeColor, dpr, hasDrawn, canvasSize],
  );

  // End of stroke — just stops drawing, does NOT advance
  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    setHasDrawn(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Background: faint reference character */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-2xl"
        style={{ width: canvasSize, height: canvasSize }}
      />

      {/* Overlay: user drawing */}
      <canvas
        ref={overlayRef}
        className="relative z-10 rounded-2xl cursor-crosshair"
        style={{ width: canvasSize, height: canvasSize, touchAction: 'none' }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      />

      {/* Controls — always at the bottom, clearly separated from drawing area */}
      <div className="absolute -bottom-14 left-0 right-0 z-20 flex justify-between gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-text-medium shadow-card active:scale-95 transition-transform"
          aria-label="지우기"
        >
          다시 쓰기
        </button>
        {strokes && (
          <button
            type="button"
            onClick={playStrokeOrder}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary shadow-card active:scale-95 transition-transform"
            aria-label={revealed === null ? '획순 보기' : '획순 숨기기'}
            aria-pressed={revealed !== null}
          >
            {revealed === null ? '획순 ▶' : '획순 ✕'}
          </button>
        )}
        {hasDrawn && (
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white shadow-card active:scale-95 transition-transform"
            aria-label="확인"
          >
            확인 ✓
          </button>
        )}
      </div>
    </div>
  );
}
