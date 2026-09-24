import type { LearningCategory } from './learning';

export type GameId =
  | 'matching'
  | 'sorting'
  | 'coloring'
  | 'bubble'
  | 'shadow'
  | 'word-builder'
  | 'missing-char'
  | 'size-compare'
  | 'odd-one-out'
  | 'pattern'
  | 'memory-sequence'
  | 'free-draw'
  | 'counting'
  | 'tracing-race'
  | 'puzzle'
  | 'connect-dots'
  | 'whack-a-mole'
  | 'catch-falling'
  | 'tap-speed'
  | 'addition'
  | 'juice-math'
  | 'number-compare'
  | 'number-order'
  | 'vehicle-missions'
  | 'food-stack'
  | 'mini-festival'
  | 'daruma'
  | 'little-market'
  | 'animal-families'
  | 'picture-words'
  | 'pattern-garden'
  | 'rocket-ride'
  | 'animal-playground';

export type GameState = 'ready' | 'playing' | 'success' | 'fail' | 'reward';

export interface GameRecord {
  runId?: string;
  gameId: GameId;
  category: LearningCategory | 'discovery' | 'play';
  score: number;
  stars: number; // 1-3
  completedAt: string;
  duration: number; // seconds
}
