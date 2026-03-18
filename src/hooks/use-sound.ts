import { useCallback, useEffect } from 'react';
import { soundManager, type SoundId } from '@/lib/sound-manager';
import { useSettingsStore } from '@/stores/settings-store';

interface UseSoundReturn {
  play: (soundId: SoundId) => void;
  preloadAll: () => void;
}

export function useSound(): UseSoundReturn {
  const sfxEnabled = useSettingsStore((s) => s.sfxEnabled);
  const volume = useSettingsStore((s) => s.volume);

  // Sync volume
  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  const play = useCallback(
    (soundId: SoundId) => {
      if (!sfxEnabled) return;
      soundManager.play(soundId);
    },
    [sfxEnabled],
  );

  const preloadAll = useCallback(() => {
    soundManager.preload();
  }, []);

  return { play, preloadAll };
}
