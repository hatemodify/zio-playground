export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  path: string;       // SVG path 'd' attribute
  points: Point[];    // Sampled points along the path
}

export interface StrokeData {
  character: string;
  viewBox: string;    // SVG viewBox (e.g. "0 0 100 100")
  strokes: Stroke[];
}

export type TracingStage = 1 | 2 | 3;

export interface CanvasConfig {
  width: number;
  height: number;
  lineWidth: number;       // default 12px
  strokeColor: string;     // user drawing color
  guideColor: string;      // guide text/path color
  dotColor: string;        // dot-to-dot point color
  dotActiveColor: string;  // active dot color
}

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 320,
  height: 320,
  lineWidth: 12,
  strokeColor: '#4A90D9',
  guideColor: 'rgba(74, 144, 217, 0.2)',
  dotColor: '#FF9F43',
  dotActiveColor: '#FFD93D',
} as const;

export interface StrokeMatchResult {
  similarity: number;   // 0-1
  isAccepted: boolean;
  coverage: number;     // 0-1 for free write mode
}
