export type TTSLang = 'ko-KR' | 'en-US';

let voicesLoaded = false;

export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return [];

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return voices;

  if (voicesLoaded) return [];

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timeout = setTimeout(() => {
      voicesLoaded = true;
      resolve(window.speechSynthesis.getVoices());
    }, 3000);

    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      voicesLoaded = true;
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function getBestVoice(lang: TTSLang): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer Google voices
  const googleVoice = voices.find(
    (v) => v.lang.startsWith(lang.split('-')[0]) && v.name.includes('Google'),
  );
  if (googleVoice) return googleVoice;

  // Fallback to any matching lang
  const langMatch = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
  if (langMatch) return langMatch;

  return null;
}

interface UtteranceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export function createUtterance(
  text: string,
  lang: TTSLang,
  options: UtteranceOptions = {},
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = options.rate ?? 0.8;
  utterance.pitch = options.pitch ?? 1.1;
  utterance.volume = options.volume ?? 1.0;

  if (options.voice) {
    utterance.voice = options.voice;
  }

  return utterance;
}
