import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  sfxEnabled: boolean;
  voiceEnabled: boolean; // pre-recorded voice clips (letters, words, prompts)
  volume: number;       // 0 ~ 1, sound-effects volume
  onboarded: boolean;

  // Actions
  toggleSfx: () => void;
  toggleVoice: () => void;
  setVolume: (volume: number) => void;
  completeOnboarding: () => void;
  resetSettings: () => void;
}

const initialState = {
  sfxEnabled: true,
  voiceEnabled: true,
  volume: 0.8,
  onboarded: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState>(
    (set) => ({
      ...initialState,

      toggleSfx: () => set((state) => ({ sfxEnabled: !state.sfxEnabled })),

      toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      completeOnboarding: () => set({ onboarded: true }),


      resetSettings: () => set(initialState),
    }),
    {
      name: 'kidsedu-settings',
      version: 1,
      partialize: (state) => ({ sfxEnabled: state.sfxEnabled, voiceEnabled: state.voiceEnabled, volume: state.volume, onboarded: state.onboarded }) as SettingsState,
      merge: (saved, current) => {
        const value = saved as Partial<SettingsState> | undefined;
        return { ...current,
          sfxEnabled: typeof value?.sfxEnabled === 'boolean' ? value.sfxEnabled : current.sfxEnabled,
          voiceEnabled: typeof value?.voiceEnabled === 'boolean' ? value.voiceEnabled : current.voiceEnabled,
          volume: typeof value?.volume === 'number' ? Math.max(0, Math.min(1, value.volume)) : current.volume,
          onboarded: value?.onboarded === true,
        };
      },
    },
  ) as unknown as StateCreator<SettingsState, [], []>,
);
