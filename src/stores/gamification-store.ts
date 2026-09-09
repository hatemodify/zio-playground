import { earnedMilestones } from '@/lib/sticker-rules';
import { localDate } from '@/lib/local-date';
import { useProgressStore } from './progress-store';
import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameRecord } from '@/types/game';
import { getLevelForStars, type LevelInfo } from '@/types/gamification';

interface GamificationState {
  totalStars: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  stickers: string[];
  unlockedGames: string[];
  characterOutfits: string[];
  gameRecords: GameRecord[];

  // Actions
  addStars: (count: number) => void;
  checkAndClaimDailyBonus: () => { bonusStars: number; newStreak: number };
  completeGame: (record: GameRecord) => string[];
  unlockGame: (gameId: string) => void;
  addSticker: (stickerId: string) => void;
  unlockOutfit: (outfitId: string) => void;
  checkAndGrantStickers: () => string[];
  resetGamification: () => void;

  // Derived
  getCurrentLevel: () => LevelInfo;
  isGameUnlocked: (gameId: string) => boolean;
  hasSticker: (stickerId: string) => boolean;
  getBestGameRecord: (gameId: string) => GameRecord | undefined;
}

const initialState = {
  totalStars: 0,
  level: 1,
  streak: 0,
  lastLoginDate: '',
  stickers: [] as string[],
  unlockedGames: ['matching', 'sorting'] as string[],
  characterOutfits: ['default'] as string[],
  gameRecords: [] as GameRecord[],
};

function getDateString(): string {
  return localDate();
}

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === localDate(yesterday);
}

export const useGamificationStore = create<GamificationState>()(
  persist<GamificationState>(
    (set, get) => ({
      ...initialState,

      addStars: (count) => {
        set((state) => {
          const newTotal = state.totalStars + count;
          const newLevel = getLevelForStars(newTotal);
          return {
            totalStars: newTotal,
            level: newLevel.level,
          };
        });
      },

      checkAndClaimDailyBonus: () => {
        const state = get();
        const today = getDateString();

        if (state.lastLoginDate === today) {
          return { bonusStars: 0, newStreak: state.streak };
        }

        let newStreak: number;
        let bonusStars = 0;

        if (isYesterday(state.lastLoginDate)) {
          newStreak = state.streak + 1;
        } else {
          newStreak = 1;
        }

        // Streak bonuses
        if (newStreak === 3) bonusStars = 5;
        if (newStreak === 7) bonusStars = 10;

        set((state) => ({
          lastLoginDate: today,
          streak: newStreak,
          totalStars: state.totalStars + bonusStars,
          level: getLevelForStars(state.totalStars + bonusStars).level,
        }));

        return { bonusStars, newStreak };
      },


      unlockGame: (gameId) => {
        set((state) => {
          if (state.unlockedGames.includes(gameId)) return state;
          return { unlockedGames: [...state.unlockedGames, gameId] };
        });
      },

      addSticker: (stickerId) => {
        set((state) => {
          if (state.stickers.includes(stickerId)) return state;
          return { stickers: [...state.stickers, stickerId] };
        });
      },

      unlockOutfit: (outfitId) => {
        set((state) => {
          if (state.characterOutfits.includes(outfitId)) return state;
          return { characterOutfits: [...state.characterOutfits, outfitId] };
        });
      },

      checkAndGrantStickers: () => {
        const newStickers = earnedMilestones(get(), useProgressStore.getState().items);
        if (newStickers.length) set((state) => ({ stickers: [...state.stickers, ...newStickers] }));
        return newStickers;
      },

      completeGame: (record) => {
        if (record.runId && get().gameRecords.some((item) => item.runId === record.runId)) return [];
        let earned: string[] = [];
        set((state) => {
          const totalStars = state.totalStars + record.stars;
          const next = { ...state, totalStars, level: getLevelForStars(totalStars).level,
            gameRecords: [...state.gameRecords, record] };
          earned = earnedMilestones(next, useProgressStore.getState().items);
          return { totalStars, level: next.level, gameRecords: next.gameRecords,
            stickers: [...state.stickers, ...earned] };
        });
        return earned;
      },

      resetGamification: () => set(initialState),

      getCurrentLevel: () => getLevelForStars(get().totalStars),

      isGameUnlocked: (gameId) => get().unlockedGames.includes(gameId),

      hasSticker: (stickerId) => get().stickers.includes(stickerId),

      getBestGameRecord: (gameId) => {
        const records = get().gameRecords.filter((r) => r.gameId === gameId);
        if (records.length === 0) return undefined;
        return records.reduce((best, r) => (r.score > best.score ? r : best));
      },
    }),
    {
      name: 'kidsedu-gamification',
      version: 1,
    },
  ) as unknown as StateCreator<GamificationState, [], []>,
);
