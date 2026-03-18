export type LearningCategory = 'numbers' | 'hangul' | 'english';

export interface ProgressItem {
  id: string;                    // "number-1", "hangul-ㄱ", "english-A"
  category: LearningCategory;
  character: string;             // "1", "ㄱ", "A"
  tracingStage: 0 | 1 | 2 | 3;  // 0=미시작, 1=따라가기, 2=점잇기, 3=자유쓰기
  completed: boolean;
  attempts: number;
  bestScore: number;             // 0-100
  lastPracticedAt: string | null;
}

export const CATEGORY_TOTALS: Record<LearningCategory, number> = {
  numbers: 10,
  hangul: 24,
  english: 26,
} as const;

export const CATEGORY_LABELS: Record<LearningCategory, string> = {
  numbers: '숫자',
  hangul: '한글',
  english: '영어',
} as const;

export const CATEGORY_COLORS: Record<LearningCategory, string> = {
  numbers: 'var(--color-numbers)',
  hangul: 'var(--color-hangul)',
  english: 'var(--color-english)',
} as const;
