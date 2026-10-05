import type { CSSProperties } from 'react';
import type { ShapeItem } from '@/data/shapes';
import { cn } from '@/lib/cn';

interface ShapeFigureProps {
  shape: ShapeItem;
  /** Rendered width in px; height follows unless `stretch` is on. */
  size?: number;
  filled?: boolean;
  /** Overrides the shape's own colour (hard rounds recolour so colour can't give the answer away). */
  color?: string;
  /** Degrees, around the centre. */
  rotate?: number;
  /** Faint dashed guide used for empty tangram slots. */
  ghost?: boolean;
  /** Fill the whole box instead of keeping the shape's own proportions. */
  stretch?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Outer/inner radii of the five-pointed star in the 100×100 box. */
function starPoints(): string {
  const points: string[] = [];
  for (let index = 0; index < 10; index++) {
    const radius = index % 2 === 0 ? 46 : 19;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push(`${(50 + radius * Math.cos(angle)).toFixed(1)},${(52 + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
}
const STAR = starPoints();
const HEART = 'M50 88 C 24 68, 6 50, 8 30 C 10 14, 30 6, 50 26 C 70 6, 90 14, 92 30 C 94 50, 76 68, 50 88 Z';
/** Tight bounding box of each geometry, so a stretched figure fills its slot edge to edge. */
const TIGHT_BOX: Record<string, string> = {
  circle: '8 8 84 84', triangle: '6 8 88 80', square: '10 10 80 80', rectangle: '4 25 92 50',
  star: '4 6 92 92', heart: '8 6 84 82', diamond: '6 4 88 92', oval: '4 20 92 60',
};

/** The geometry for one shape, drawn into a 100×100 viewBox. */
function Geometry({ slug, ...paint }: { slug: string; fill: string; stroke: string; strokeWidth: number; strokeDasharray?: string }) {
  switch (slug) {
    case 'circle': return <circle cx="50" cy="50" r="42" {...paint} />;
    case 'triangle': return <polygon points="50,8 94,88 6,88" strokeLinejoin="round" {...paint} />;
    case 'square': return <rect x="10" y="10" width="80" height="80" rx="6" {...paint} />;
    case 'rectangle': return <rect x="4" y="25" width="92" height="50" rx="6" {...paint} />;
    case 'star': return <polygon points={STAR} strokeLinejoin="round" {...paint} />;
    case 'heart': return <path d={HEART} strokeLinejoin="round" {...paint} />;
    case 'diamond': return <polygon points="50,4 94,50 50,96 6,50" strokeLinejoin="round" {...paint} />;
    case 'oval': return <ellipse cx="50" cy="50" rx="46" ry="30" {...paint} />;
    default: return null;
  }
}

/** One basic shape as an SVG, so it looks the same on every device's fonts. */
export default function ShapeFigure({ shape, size = 96, filled = true, color, rotate = 0, ghost = false, stretch = false, className, style }: ShapeFigureProps) {
  const tone = color ?? shape.color;
  const paint = ghost
    ? { fill: 'none', stroke: '#94a3b8', strokeWidth: 3, strokeDasharray: '6 5' }
    : filled
      ? { fill: tone, stroke: tone, strokeWidth: 2 }
      : { fill: 'none', stroke: tone, strokeWidth: 7 };
  return (
    <svg
      viewBox={stretch ? TIGHT_BOX[shape.slug] ?? '0 0 100 100' : '0 0 100 100'}
      width={stretch ? '100%' : size}
      height={stretch ? '100%' : size}
      preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}
      className={cn('shape-figure', className)}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      data-shape={shape.slug}
      aria-hidden="true"
    >
      <Geometry slug={shape.slug} {...paint} />
    </svg>
  );
}
