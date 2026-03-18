export type SoundId =
  | 'button_click'
  | 'correct'
  | 'wrong'
  | 'star_earned'
  | 'level_up'
  | 'stroke_draw'
  | 'stroke_complete'
  | 'confetti'
  | 'balloon_pop'
  | 'card_flip'
  | 'match_success'
  | 'drag_pickup'
  | 'drag_drop'
  | 'encouragement';

interface ToneConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  ramp?: 'up' | 'down';
  detune?: number;
}

const SOUND_CONFIGS: Record<SoundId, ToneConfig[]> = {
  button_click: [{ frequency: 800, duration: 0.06, type: 'sine', gain: 0.3 }],
  correct: [
    { frequency: 523, duration: 0.1, type: 'sine', gain: 0.4 },
    { frequency: 659, duration: 0.1, type: 'sine', gain: 0.4 },
    { frequency: 784, duration: 0.15, type: 'sine', gain: 0.4 },
  ],
  wrong: [{ frequency: 250, duration: 0.3, type: 'sine', gain: 0.2, ramp: 'down' }],
  star_earned: [
    { frequency: 880, duration: 0.08, type: 'sine', gain: 0.3 },
    { frequency: 1108, duration: 0.08, type: 'sine', gain: 0.3 },
    { frequency: 1320, duration: 0.15, type: 'sine', gain: 0.35 },
  ],
  level_up: [
    { frequency: 523, duration: 0.12, type: 'square', gain: 0.25 },
    { frequency: 659, duration: 0.12, type: 'square', gain: 0.25 },
    { frequency: 784, duration: 0.12, type: 'square', gain: 0.25 },
    { frequency: 1047, duration: 0.3, type: 'square', gain: 0.3 },
  ],
  stroke_draw: [{ frequency: 440, duration: 0.03, type: 'sine', gain: 0.1 }],
  stroke_complete: [
    { frequency: 660, duration: 0.08, type: 'sine', gain: 0.3 },
    { frequency: 880, duration: 0.12, type: 'sine', gain: 0.35 },
  ],
  confetti: [
    { frequency: 600, duration: 0.05, type: 'sine', gain: 0.25 },
    { frequency: 800, duration: 0.05, type: 'sine', gain: 0.25 },
    { frequency: 1000, duration: 0.05, type: 'sine', gain: 0.25 },
    { frequency: 1200, duration: 0.1, type: 'sine', gain: 0.3 },
  ],
  balloon_pop: [{ frequency: 1200, duration: 0.08, type: 'sawtooth', gain: 0.3, ramp: 'down' }],
  card_flip: [{ frequency: 500, duration: 0.08, type: 'sine', gain: 0.2 }],
  match_success: [
    { frequency: 523, duration: 0.1, type: 'sine', gain: 0.3 },
    { frequency: 784, duration: 0.15, type: 'sine', gain: 0.35 },
  ],
  drag_pickup: [{ frequency: 400, duration: 0.06, type: 'sine', gain: 0.2, ramp: 'up' }],
  drag_drop: [{ frequency: 600, duration: 0.08, type: 'sine', gain: 0.25 }],
  encouragement: [
    { frequency: 440, duration: 0.15, type: 'sine', gain: 0.2 },
    { frequency: 554, duration: 0.2, type: 'sine', gain: 0.25 },
  ],
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private volume = 0.8;
  private unlocked = false;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.ctx;
  }

  unlock(): void {
    if (this.unlocked) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play silent buffer to fully unlock AudioContext on iOS
    try {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch { /* ignore */ }
    this.unlocked = true;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  async play(soundId: SoundId): Promise<void> {
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* ignore */ }
    }

    const tones = SOUND_CONFIGS[soundId];
    if (!tones) return;

    let offset = 0;
    for (const tone of tones) {
      this.playTone(ctx, tone, offset);
      offset += tone.duration;
    }
  }

  private playTone(ctx: AudioContext, config: ToneConfig, delay: number): void {
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.value = config.frequency;
      if (config.detune) {
        oscillator.detune.value = config.detune;
      }

      const now = ctx.currentTime + delay;
      const effectiveGain = config.gain * this.volume;

      if (config.ramp === 'up') {
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(effectiveGain, now + config.duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
      } else if (config.ramp === 'down') {
        gainNode.gain.setValueAtTime(effectiveGain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      } else {
        gainNode.gain.setValueAtTime(effectiveGain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration * 0.9);
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + config.duration + 0.05);
    } catch {
      // silently ignore audio errors
    }
  }

  preload(): void {
    this.getContext();
  }
}

export const soundManager = new SoundManager();
