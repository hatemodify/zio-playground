import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  sfxEnabled: boolean;
  volume: number;       // 0 ~ 1, sound-effects volume
  onboarded: boolean;
  dailyTimeLimit: number; // minutes: 15, 30, 0 (unlimited)

  // Actions
  toggleSfx: () => void;
  setVolume: (volume: number) => void;
  completeOnboarding: () => void;
  setDailyTimeLimit: (minutes: number) => void;
  resetSettings: () => void;
}

const initialState = {
  sfxEnabled: true,
  volume: 0.8,
  onboarded: false,
  dailyTimeLimit: 30,
};

export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState>(
    (set) => ({
      ...initialState,

      toggleSfx: () => set((state) => ({ sfxEnabled: !state.sfxEnabled })),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      completeOnboarding: () => set({ onboarded: true }),

      setDailyTimeLimit: (minutes) => set({ dailyTimeLimit: minutes }),

      resetSettings: () => set(initialState),
    }),
    {
      name: 'kidsedu-settings',
      version: 1,
    },
  ) as unknown as StateCreator<SettingsState, [], []>,
);
