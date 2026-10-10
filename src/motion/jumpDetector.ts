export type JumpPhase = 'STILL' | 'RUN' | 'READY';
export type JumpReading = {
  phase: JumpPhase;
  progress: number;
  magnitude: number;
  threshold: number;
  jump: boolean;
};

// A body-mounted phone should be kept in the same orientation during calibration and play.
export class JumpDetector {
  private startAt: number | null = null;
  private samples: number[] = [];
  private stillSamples: number[] = [];
  private threshold = 17;
  private above = 0;
  private lastJumpAt = -Infinity;
  private lastSampleAt = -Infinity;

  reset() {
    this.startAt = null;
    this.samples = [];
    this.stillSamples = [];
    this.threshold = 17;
    this.above = 0;
    this.lastJumpAt = -Infinity;
    this.lastSampleAt = -Infinity;
  }

  update(x: number, y: number, z: number, now: number): JumpReading {
    const magnitude = Math.hypot(x, y, z);
    if (!Number.isFinite(magnitude) || magnitude < 0) return { phase: 'STILL', progress: 0, magnitude: 0, threshold: this.threshold, jump: false };
    if (this.startAt === null) this.startAt = now;
    const elapsed = now - this.startAt;
    if (elapsed < 2000) {
      this.stillSamples.push(magnitude);
      return { phase: 'STILL', progress: elapsed / 2000, magnitude, threshold: this.threshold, jump: false };
    }
    if (elapsed < 4000) {
      this.samples.push(magnitude);
      return { phase: 'RUN', progress: (elapsed - 2000) / 2000, magnitude, threshold: this.threshold, jump: false };
    }
    if (this.samples.length) {
      const sorted = [...this.samples].sort((a, b) => a - b);
      const stillMean = this.stillSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, this.stillSamples.length);
      this.threshold = Math.max(16, stillMean * 1.6, sorted[Math.floor((sorted.length - 1) * 0.95)] + 4);
      this.samples = [];
      this.stillSamples = [];
    }
    if (now - this.lastSampleAt > 120 || now - this.lastJumpAt < 800) this.above = 0;
    this.lastSampleAt = now;
    this.above = magnitude > this.threshold ? this.above + 1 : 0;
    const jump = this.above >= 2 && now - this.lastJumpAt >= 800;
    if (jump) {
      this.lastJumpAt = now;
      this.above = 0;
    }
    return { phase: 'READY', progress: 1, magnitude, threshold: this.threshold, jump };
  }
}
