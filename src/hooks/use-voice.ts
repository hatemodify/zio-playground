import { useCallback, useEffect } from 'react';
import { soundManager } from '@/lib/sound-manager';
import { useSettingsStore } from '@/stores/settings-store';
import { voiceClipUrl } from '@/data/voice-lines';

interface UseVoiceReturn {
  /** Whether the parent has voice turned on in settings. */
  enabled: boolean;
  /** Plays a clip by its voice id (see `voiceId` in data/voice-lines). Resolves true once audible. */
  speak: (id: string) => Promise<boolean>;
  /** Warms the cache for clips the page is about to need. */
  preload: (ids: string[]) => void;
  stop: () => void;
}

/**
 * Pre-recorded voice lines, gated by the `voiceEnabled` setting. Clips go
 * through the shared AudioContext, so they only become audible after the
 * app's first tap has unlocked it — pages that speak on open should still
 * offer a speaker button for the very first screen.
 */
export function useVoice({ always = false }: { always?: boolean } = {}): UseVoiceReturn {
  const setting = useSettingsStore((s) => s.voiceEnabled);
  // Listening games are nothing without their clips, so they play regardless of the setting.
  const enabled = always || setting;
  const volume = useSettingsStore((s) => s.volume);

  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  const speak = useCallback(async (id: string) => {
    if (!enabled) return false;
    return soundManager.playClip(voiceClipUrl(id));
  }, [enabled]);

  const preload = useCallback((ids: string[]) => {
    if (!enabled) return;
    for (const id of ids) soundManager.preloadClip(voiceClipUrl(id));
  }, [enabled]);

  const stop = useCallback(() => soundManager.stopVoice(), []);

  return { enabled, speak, preload, stop };
}

/**
 * Speaks `id` when a page opens or moves on to the next item — but only once
 * the AudioContext is already unlocked, so the very first screen stays silent
 * until the child taps something (the speaker buttons cover that case).
 */
export function useAutoSpeak(id: string | null | undefined): void {
  const { enabled, speak, stop } = useVoice();
  useEffect(() => {
    if (!id || !enabled || !soundManager.ready) return;
    const timer = window.setTimeout(() => void speak(id), 350);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [id, enabled, speak, stop]);
}
