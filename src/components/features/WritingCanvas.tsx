import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/cn';

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

/**
 * Simple writing canvas for character practice.
 * Shows a faint reference character, lets the user draw freely,
 * and only advances when the confirm button is explicitly tapped.
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
  const [hasDrawn, setHasDrawn] = useState(false);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Draw faint reference character on background canvas
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Very faint reference character (just enough to know what to write)
    ctx.globalAlpha = 0.08;
    ctx.font = `bold ${canvasSize * 0.6}px "Nunito", "Pretendard Variable", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#999';
    ctx.fillText(character, canvasSize / 2, canvasSize / 2);

    ctx.restore();
  }, [character, canvasSize, dpr]);

  // Initialize canvases
  useEffect(() => {
    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;
    };

    setupCanvas(canvasRef.current);
    setupCanvas(overlayRef.current);
    drawGuide();
  }, [canvasSize, dpr, drawGuide]);

  // Reset when character changes
  useEffect(() => {
    setHasDrawn(false);
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    drawGuide();
  }, [character, drawGuide]);

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
      ctx.lineWidth = 12 * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPointRef.current = point;
      if (!hasDrawn) setHasDrawn(true);
    },
    [getPoint, strokeColor, dpr, hasDrawn],
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
