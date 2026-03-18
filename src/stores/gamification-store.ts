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
  recordGameScore: (record: GameRecord) => void;
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
  unlockedGames: ['matching', 'quiz'] as string[],
  characterOutfits: ['default'] as string[],
  gameRecords: [] as GameRecord[],
};

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
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

      recordGameScore: (record) => {
        set((state) => ({
          gameRecords: [...state.gameRecords, record],
        }));
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
        const state = get();
        const { totalStars, level, streak, gameRecords, stickers } = state;
        const newStickers: string[] = [];

        const uniqueGames = new Set(gameRecords.map((r) => r.gameId));

        // Game-related stickers
        if (gameRecords.length >= 1 && !stickers.includes('sticker-special-firstgame')) {
          newStickers.push('sticker-special-firstgame');
        }
        if (uniqueGames.size >= 5 && !stickers.includes('sticker-ocean-dolphin')) {
          newStickers.push('sticker-ocean-dolphin');
        }
        if (uniqueGames.size >= 10 && !stickers.includes('sticker-music-guitar')) {
          newStickers.push('sticker-music-guitar');
        }
        if (uniqueGames.size >= 23 && !stickers.includes('sticker-special-allgames')) {
          newStickers.push('sticker-special-allgames');
        }

        // Star-related stickers
        if (totalStars >= 30 && !stickers.includes('sticker-ocean-whale')) {
          newStickers.push('sticker-ocean-whale');
        }
        if (totalStars >= 50 && !stickers.includes('sticker-space-ufo')) {
          newStickers.push('sticker-space-ufo');
        }
        if (totalStars >= 100 && !stickers.includes('sticker-dino-tricera')) {
          newStickers.push('sticker-dino-tricera');
        }
        if (totalStars >= 200 && !stickers.includes('sticker-sports-soccer')) {
          newStickers.push('sticker-sports-soccer');
        }

        // Level-related stickers
        const levelStickerMap: Record<number, string> = {
          3: 'sticker-space-rocket',
          4: 'sticker-music-drum',
          5: 'sticker-space-astronaut',
          7: 'sticker-dino-trex',
          10: 'sticker-sports-medal',
        };
        for (const [lvl, id] of Object.entries(levelStickerMap)) {
          if (level >= Number(lvl) && !stickers.includes(id)) {
            newStickers.push(id);
          }
        }

        // Streak-related stickers
        const streakStickerMap: Record<number, string> = {
          3: 'sticker-special-streak3',
          7: 'sticker-special-streak7',
          14: 'sticker-ocean-octopus',
          30: 'sticker-music-piano',
        };
        for (const [days, id] of Object.entries(streakStickerMap)) {
          if (streak >= Number(days) && !stickers.includes(id)) {
            newStickers.push(id);
          }
        }

        if (newStickers.length > 0) {
          set((s) => ({
            stickers: [...s.stickers, ...newStickers],
          }));
        }

        return newStickers;
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
