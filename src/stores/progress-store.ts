import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import type { LearningCategory, ProgressItem } from '@/types/learning';
import { CATEGORY_TOTALS } from '@/types/learning';

const ProgressItemSchema = z.object({
  id: z.string(),
  category: z.enum(['numbers', 'hangul', 'english']),
  character: z.string(),
  tracingStage: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  completed: z.boolean(),
  attempts: z.number(),
  bestScore: z.number(),
  lastPracticedAt: z.string().nullable(),
});

const StoreSchema = z.object({
  items: z.record(z.string(), ProgressItemSchema),
  nickname: z.string(),
});

interface ProgressState {
  items: Record<string, ProgressItem>;
  nickname: string;

  // Actions
  completeTracingStage: (id: string, stage: 1 | 2 | 3) => void;
  markCompleted: (id: string) => void;
  updateBestScore: (id: string, score: number) => void;
  setNickname: (name: string) => void;
  resetProgress: () => void;
  initializeItem: (item: ProgressItem) => void;

  // Selectors
  getCategoryItems: (category: LearningCategory) => ProgressItem[];
  getCategoryProgress: (category: LearningCategory) => { completed: number; total: number };
  getCompletionPercentage: (category: LearningCategory) => number;
  isItemCompleted: (id: string) => boolean;
  getItem: (id: string) => ProgressItem | undefined;
}

const initialState = {
  items: {} as Record<string, ProgressItem>,
  nickname: '',
};

export const useProgressStore = create<ProgressState>()(
  persist<ProgressState>(
    (set, get) => ({
      ...initialState,

      completeTracingStage: (id, stage) => {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;

          const newStage = Math.max(item.tracingStage, stage) as 0 | 1 | 2 | 3;
          return {
            items: {
              ...state.items,
              [id]: {
                ...item,
                tracingStage: newStage,
                attempts: item.attempts + 1,
                lastPracticedAt: new Date().toISOString(),
                completed: newStage >= 3 ? true : item.completed,
              },
            },
          };
        });
      },

      markCompleted: (id) => {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [id]: { ...item, completed: true, lastPracticedAt: new Date().toISOString() },
            },
          };
        });
      },

      updateBestScore: (id, score) => {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [id]: { ...item, bestScore: Math.max(item.bestScore, score) },
            },
          };
        });
      },

      setNickname: (name) => set({ nickname: name }),

      resetProgress: () => set({ items: {}, nickname: '' }),

      initializeItem: (item) => {
        set((state) => {
          if (state.items[item.id]) return state;
          return { items: { ...state.items, [item.id]: item } };
        });
      },

      getCategoryItems: (category) => {
        return Object.values(get().items).filter((item) => item.category === category);
      },

      getCategoryProgress: (category) => {
        const items = Object.values(get().items).filter((i) => i.category === category);
        const completed = items.filter((i) => i.completed).length;
        return { completed, total: CATEGORY_TOTALS[category] };
      },

      getCompletionPercentage: (category) => {
        const { completed, total } = get().getCategoryProgress(category);
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
      },

      isItemCompleted: (id) => {
        return get().items[id]?.completed ?? false;
      },

      getItem: (id) => {
        return get().items[id];
      },
    }),
    {
      name: 'kidsedu-progress',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0 || version === 1) {
          const parsed = StoreSchema.safeParse(persisted);
          if (parsed.success) {
            return parsed.data as ProgressState;
          }
        }
        return initialState as unknown as ProgressState;
      },
    },
  ) as unknown as StateCreator<ProgressState, [], []>,
);
