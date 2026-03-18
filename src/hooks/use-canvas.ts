import { useRef, useEffect, useCallback } from 'react';

interface UseCanvasOptions {
  width: number;
  height: number;
  dpr?: number;
}

/**
 * Low-level canvas hook for setting up a 2D rendering context
 * with proper DPI scaling.
 */
export function useCanvas({ width, height, dpr }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectiveDpr = dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * effectiveDpr;
    canvas.height = height * effectiveDpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(effectiveDpr, effectiveDpr);
    }
  }, [width, height, effectiveDpr]);

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d') ?? null;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  return { canvasRef, getContext, clear };
}
