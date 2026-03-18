import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { SKETCHES, SKETCH_CATEGORIES } from '@/data';
import type { SketchCategory, SketchData } from '@/data';
import { cn } from '@/lib/cn';

const PALETTE_COLORS = [
  '#FF6B81', '#FF9F43', '#FFD93D', '#2ED573',
  '#4A90D9', '#A29BFE', '#FF9FF3', '#8B5E3C',
];

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
  const { state: gameState, start, finish, reset, score, calculateStars, earnedStickers } = useGameLogic({});

  const [sketchCategory, setSketchCategory] = useState<SketchCategory>('animals');
  const [selectedSketch, setSelectedSketch] = useState<SketchData | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [showReward, setShowReward] = useState(true);

  const canvasSize = 480;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const drawSketchOutline = useCallback((ctx: CanvasRenderingContext2D, sketch: SketchData) => {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    sketch.draw(ctx, canvasSize);
    ctx.restore();
  }, [canvasSize, dpr]);

  const initCanvas = useCallback((sketch: SketchData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSketchOutline(ctx, sketch);
  }, [canvasSize, dpr, drawSketchOutline]);

  const startGameWithSketch = useCallback((sketch: SketchData) => {
    setSelectedSketch(sketch);
    setShowPicker(false);
    setCoveragePercent(0);
    start(1);
    setTimeout(() => initCanvas(sketch), 50);
  }, [start, initCanvas]);

  const calculateCoverage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let filledPixels = 0;
    const totalPixels = data.length / 4;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 50) filledPixels++;
    }
    return (filledPixels / totalPixels) * 100;
  }, []);

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  }, [dpr]);

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
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 20 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    lastPointRef.current = point;
  }, [getPoint, selectedColor, dpr]);

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    const coverage = calculateCoverage();
    setCoveragePercent(Math.round(coverage));

    if (coverage >= 8 && gameState === 'playing') {
      play('confetti');
      finish(1);
    }
  }, [calculateCoverage, gameState, play, finish]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    reset();
    setShowPicker(true);
    setSelectedSketch(null);
  }, [reset]);

  const handleBackToPicker = useCallback(() => {
    reset();
    setShowPicker(true);
    setSelectedSketch(null);
    setCoveragePercent(0);
  }, [reset]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;
  const filteredSketches = SKETCHES.filter(s => s.category === sketchCategory);

  if (gameState === 'reward') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8  h-full justify-center">
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
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-games/10 px-2 py-1 text-sm font-bold text-games touch-manipulation"
            onClick={handleBackToPicker}
            aria-label="다른 그림 선택"
          >
            ← 다른 그림
          </button>
          <h2 className="text-xl font-bold text-games">
            {selectedSketch?.emoji} {selectedSketch?.name}
          </h2>
        </div>
        <span className="text-sm font-medium text-text-medium">{coveragePercent}%</span>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <div className="rounded-3xl bg-white p-3 shadow-card">
          <canvas
            ref={canvasRef}
            className="rounded-2xl cursor-crosshair"
            style={{ width: canvasSize, height: canvasSize, touchAction: 'none' }}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
          />
        </div>
      </div>

      {/* Color palette */}
      <div className="flex justify-center gap-2">
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
      </div>

      {/* Clear button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedSketch) {
              initCanvas(selectedSketch);
              setCoveragePercent(0);
            }
          }}
        >
          다시 칠하기
        </Button>
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={coveragePercent > 5 ? 'happy' : 'encouraging'}
          size="sm"
          message={coveragePercent > 5 ? '예쁘다!' : '색을 골라 칠해봐!'}
        />
      </div>
    </div>
  );
}
