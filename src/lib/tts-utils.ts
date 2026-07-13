export type TTSLang = 'ko-KR' | 'en-US';

export interface TTSDiagnostics {
  supported: boolean;
  primed: boolean;
  voiceCount: number;
  koreanVoice: string | null;
  englishVoice: string | null;
}

const isSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoices: SpeechSynthesisVoice[] = [];
let primed = false;

function refreshVoices(): void {
  if (!isSupported()) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
}

// Voices arrive asynchronously on Chrome/Android and after the first speak() on
// some iOS builds. Keep a cache warm instead of awaiting them inside speak() —
// an await there would push the actual speak() call out of the user-gesture tick,
// which iOS Safari rejects silently.
if (isSupported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length === 0) refreshVoices();
  return cachedVoices;
}

export function getBestVoice(lang: TTSLang): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const prefix = lang.split('-')[0];
  const matching = voices.filter((v) => v.lang.replace('_', '-').startsWith(prefix));
  if (matching.length === 0) return null;

  // A local voice keeps working offline — this app is a PWA kids use without a network.
  return (
    matching.find((v) => v.localService && v.name.includes('Google')) ??
    matching.find((v) => v.localService) ??
    matching.find((v) => v.name.includes('Google')) ??
    matching[0]
  );
}

export function hasVoiceFor(lang: TTSLang): boolean {
  return getBestVoice(lang) !== null;
}

/**
 * Must run inside a real user gesture (touch/click). iOS Safari and Android
 * WebViews keep speech muted until an utterance is spoken from a gesture; this
 * spends the app's first tap on a silent one so later speech is allowed.
 */
export function primeSpeech(): void {
  if (!isSupported() || primed) return;
  primed = true;

  try {
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  } catch {
    // A failed prime is not fatal — speak() retries on its own.
  }
  refreshVoices();
}

export function isPrimed(): boolean {
  return primed;
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

  const voice = options.voice ?? getBestVoice(lang);
  if (voice) utterance.voice = voice;

  return utterance;
}

/** How long to wait for `onstart` before assuming the engine dropped the utterance. */
const START_TIMEOUT_MS = 400;

interface SpeakOptions extends UtteranceOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Speaks `text`, synchronously enough to survive iOS Safari's gesture check:
 * nothing is awaited before `speechSynthesis.speak()`.
 *
 * Two engine quirks are handled: Chrome can leave synthesis in a paused state
 * (resume() clears it), and Android/Chrome sometimes swallows an utterance
 * queued right after cancel() — so if `onstart` never fires, we retry once.
 */
export function speakNow(text: string, lang: TTSLang, options: SpeakOptions = {}): () => void {
  if (!isSupported()) {
    options.onEnd?.();
    return () => {};
  }

  const synth = window.speechSynthesis;
  let started = false;
  let finished = false;
  let retried = false;
  let startTimer: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(startTimer);
    options.onEnd?.();
  };

  const enqueue = () => {
    const utterance = createUtterance(text, lang, options);

    utterance.onstart = () => {
      started = true;
      clearTimeout(startTimer);
      options.onStart?.();
    };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      // 'interrupted'/'canceled' just means we replaced this utterance on purpose.
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('TTS error:', event.error);
      }
      finish();
    };

    synth.cancel();
    synth.speak(utterance);
    // Chrome pauses synthesis when a tab regains focus; a paused queue never starts.
    synth.resume();

    startTimer = setTimeout(() => {
      if (started || finished) return;
      if (retried) {
        finish();
        return;
      }
      retried = true;
      enqueue();
    }, START_TIMEOUT_MS);
  };

  enqueue();

  return () => {
    clearTimeout(startTimer);
    if (!finished) {
      finished = true;
      synth.cancel();
    }
  };
}

export function stopSpeech(): void {
  if (!isSupported()) return;
  window.speechSynthesis.cancel();
}

export function getDiagnostics(): TTSDiagnostics {
  if (!isSupported()) {
    return { supported: false, primed: false, voiceCount: 0, koreanVoice: null, englishVoice: null };
  }
  return {
    supported: true,
    primed,
    voiceCount: getAvailableVoices().length,
    koreanVoice: getBestVoice('ko-KR')?.name ?? null,
    englishVoice: getBestVoice('en-US')?.name ?? null,
  };
}
