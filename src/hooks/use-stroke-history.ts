import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Point } from '@/types/canvas';

export interface DrawStroke {
  color: string;
  /** Line width as a fraction of canvas width, so a stroke survives any resize. */
  widthRatio: number;
  alpha?: number;
  /** Points in normalized [0..1] canvas space. */
  points: Point[];
}

interface UseStrokeHistoryOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Paints the immutable backdrop (white fill, sketch outline, ...) in backing-store pixels. */
  drawBase: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  maxStrokes?: number;
}

/** Paints one stroke as a single path, so alpha never doubles up at the joins. */
function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawStroke,
  width: number,
  height: number,
): void {
  const { points, color, widthRatio, alpha = 1 } = stroke;
  if (points.length === 0) return;

  const lineWidth = widthRatio * width;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x * width, points[0].y * height, lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Undo/redo for canvas drawing, held as vector strokes rather than bitmap
 * snapshots — a full-resolution ImageData per step would run to hundreds of MB.
 * Points are normalized, so a repaint can target any canvas size.
 *
 * Committed strokes are rendered once into an offscreen layer; the in-progress
 * stroke is previewed on top of a blit of that layer, so live drawing stays
 * pixel-identical to what a replay produces.
 */
export function useStrokeHistory({ canvasRef, drawBase, maxStrokes = 60 }: UseStrokeHistoryOptions) {
  const strokesRef = useRef<DrawStroke[]>([]);
  const redoRef = useRef<DrawStroke[]>([]);
  const layerRef = useRef<HTMLCanvasElement | null>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const drawBaseRef = useRef(drawBase);
  useEffect(() => {
    drawBaseRef.current = drawBase;
  });

  const syncFlags = useCallback(() => {
    setCanUndo(strokesRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  const getLayer = useCallback((): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    let layer = layerRef.current;
    if (!layer) {
      layer = document.createElement('canvas');
      layerRef.current = layer;
    }
    if (layer.width !== canvas.width || layer.height !== canvas.height) {
      layer.width = canvas.width;
      layer.height = canvas.height;
    }
    return layer;
  }, [canvasRef]);

  /** Rebuild the committed layer from base + strokes and blit it to the visible canvas. */
  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const layer = getLayer();
    if (!canvas || !layer) return;

    const layerCtx = layer.getContext('2d');
    const ctx = canvas.getContext('2d');
    if (!layerCtx || !ctx) return;

    const { width, height } = canvas;
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    layerCtx.clearRect(0, 0, width, height);
    drawBaseRef.current(layerCtx, width, height);
    for (const stroke of strokesRef.current) {
      renderStroke(layerCtx, stroke, width, height);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(layer, 0, 0);
  }, [canvasRef, getLayer]);

  /** Draw an uncommitted stroke on top of the committed layer. */
  const preview = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !layer || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer, 0, 0);
    renderStroke(ctx, stroke, canvas.width, canvas.height);
  }, [canvasRef]);

  const commit = useCallback((stroke: DrawStroke) => {
    if (stroke.points.length === 0) return;
    strokesRef.current = [...strokesRef.current, stroke].slice(-maxStrokes);
    redoRef.current = [];
    repaint();
    syncFlags();
  }, [maxStrokes, repaint, syncFlags]);

  const undo = useCallback(() => {
    const strokes = strokesRef.current;
    if (strokes.length === 0) return;
    strokesRef.current = strokes.slice(0, -1);
    redoRef.current = [...redoRef.current, strokes[strokes.length - 1]];
    repaint();
    syncFlags();
  }, [repaint, syncFlags]);

  const redo = useCallback(() => {
    const redoable = redoRef.current;
    if (redoable.length === 0) return;
    redoRef.current = redoable.slice(0, -1);
    strokesRef.current = [...strokesRef.current, redoable[redoable.length - 1]];
    repaint();
    syncFlags();
  }, [repaint, syncFlags]);

  /** Drop every stroke and repaint the bare backdrop. */
  const reset = useCallback(() => {
    strokesRef.current = [];
    redoRef.current = [];
    repaint();
    syncFlags();
  }, [repaint, syncFlags]);

  return { canUndo, canRedo, preview, commit, undo, redo, reset, repaint };
}
