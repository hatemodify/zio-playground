import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvailableVoices, getBestVoice, createUtterance, type TTSLang } from '@/lib/tts-utils';
import { useSettingsStore } from '@/stores/settings-store';

interface UseTTSReturn {
  speak: (text: string, lang: TTSLang) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const volume = useSettingsStore((s) => s.volume);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Preload voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = async () => {
      try {
        await getAvailableVoices();
      } catch {
        // silently ignore
      }
    };

    loadVoices();
  }, [isSupported]);

  // Cleanup on unmount — only cancel if this component started the current utterance
  useEffect(() => {
    return () => {
      if (activeUtteranceRef.current && isSupported) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    async (text: string, lang: TTSLang): Promise<void> => {
      if (!isSupported) {
        console.warn('TTS not supported in this browser');
        return;
      }

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        // Wait for cancel to complete before speaking again
        await new Promise<void>((r) => setTimeout(r, 50));

        // Try to get voice, wait for voices to load if needed
        let voice = getBestVoice(lang);
        if (!voice) {
          await getAvailableVoices();
          voice = getBestVoice(lang);
        }

        const utterance = createUtterance(text, lang, {
          rate: ttsSpeed,
          pitch: 1.1,
          volume,
          voice,
        });

        activeUtteranceRef.current = utterance;

        return new Promise<void>((resolve) => {
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            activeUtteranceRef.current = null;
            resolve();
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            activeUtteranceRef.current = null;
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        });
      } catch (error) {
        console.warn('TTS error:', error);
        setIsSpeaking(false);
      }
    },
    [isSupported, ttsSpeed, volume],
  );

  return { speak, stop, isSpeaking, isSupported };
}
