import type { LearningCategory } from './learning';

export type GameId =
  | 'matching'
  | 'sorting'
  | 'coloring'
  | 'shadow'
  | 'word-builder'
  | 'missing-char'
  | 'size-compare'
  | 'odd-one-out'
  | 'memory-sequence'
  | 'free-draw'
  | 'puzzle'
  | 'connect-dots'
  | 'whack-a-mole'
  | 'juice-math'
  | 'number-compare'
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
