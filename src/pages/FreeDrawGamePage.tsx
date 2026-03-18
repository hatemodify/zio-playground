import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// motion unused in this page
import Button from '@/components/ui/Button';
import { RewardCelebration } from '@/components/features';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSound } from '@/hooks/use-sound';
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

export default function FreeDrawGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { addStars, recordGameScore } = useGamificationStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [selectedColor, setSelectedColor] = useState(COLORS[4].value);
  const [brushSize, setBrushSize] = useState(8);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const canvasSize = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 32 : 360);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }, [canvasSize, dpr]);

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDraw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }, [getPoint]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // For white "eraser", ensure it draws over
    if (selectedColor === '#FFFFFF') {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = point;
    if (!hasDrawn) setHasDrawn(true);
  }, [getPoint, selectedColor, brushSize, dpr, hasDrawn]);

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.restore();
    setHasDrawn(false);
  }, [canvasSize, dpr]);

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
    <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-games">자유 그리기</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
          돌아가기
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <div className="rounded-2xl bg-white shadow-card overflow-hidden" style={{ width: canvasSize, height: canvasSize }}>
          <canvas
            ref={canvasRef}
            className="cursor-crosshair"
            style={{ width: canvasSize, height: canvasSize, touchAction: 'none' }}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
          />
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap justify-center gap-2">
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

      {/* Brush size */}
      <div className="flex items-center justify-center gap-3">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            className={cn(
              'flex items-center justify-center rounded-full transition-all touch-manipulation',
              brushSize === size
                ? 'bg-primary/20 ring-2 ring-primary'
                : 'bg-gray-100',
            )}
            style={{ width: 36, height: 36 }}
            onClick={() => setBrushSize(size)}
            aria-label={`브러시 ${size}px`}
          >
            <div
              className="rounded-full bg-text-dark"
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={clearCanvas}>
          지우기
        </Button>
        {hasDrawn && (
          <Button variant="primary" onClick={handleComplete}>
            완성!
          </Button>
        )}
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
