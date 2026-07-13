import { useCallback, useEffect, useRef, useState } from 'react';
import {
  speakNow,
  stopSpeech,
  getDiagnostics,
  hasVoiceFor,
  type TTSLang,
  type TTSDiagnostics,
} from '@/lib/tts-utils';
import { useSettingsStore } from '@/stores/settings-store';

interface UseTTSReturn {
  speak: (text: string, lang: TTSLang) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  hasVoice: (lang: TTSLang) => boolean;
  diagnostics: () => TTSDiagnostics;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const volume = useSettingsStore((s) => s.volume);

  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, lang: TTSLang): Promise<void> => {
      if (!isSupported) return Promise.resolve();

      // No await before speakNow: iOS Safari only honours speech that is queued
      // in the same tick as the tap that triggered it.
      return new Promise<void>((resolve) => {
        cancelRef.current?.();
        cancelRef.current = speakNow(text, lang, {
          rate: ttsSpeed,
          pitch: 1.1,
          volume,
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            cancelRef.current = null;
            resolve();
          },
        });
      });
    },
    [isSupported, ttsSpeed, volume],
  );

  const hasVoice = useCallback((lang: TTSLang) => hasVoiceFor(lang), []);

  return { speak, stop, isSpeaking, isSupported, hasVoice, diagnostics: getDiagnostics };
}
