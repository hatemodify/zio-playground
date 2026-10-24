export type LaneDirection = -1 | 0 | 1;

/** A continuous, centered pose is required before hands-free start or resume. */
export class RaceReadyCountdown {
  private readySince: number | null = null;
  private completed = false;

  reset() {
    this.readySince = null;
    this.completed = false;
  }

  update(ready: boolean, now: number): { seconds: number | null; complete: boolean } {
    if (!ready || !Number.isFinite(now)) {
      this.reset();
      return { seconds: null, complete: false };
    }
    if (this.completed) return { seconds: null, complete: false };
    if (this.readySince === null) this.readySince = now;
    const remaining = 1500 - (now - this.readySince);
    if (remaining <= 0) {
      this.completed = true;
      return { seconds: null, complete: true };
    }
    return { seconds: Math.ceil(remaining / 1000), complete: false };
  }
}

/** A sidestep changes one lane; returning to the center only rearms the next step. */
export class RaceSidestepDetector {
  private readonly centerThreshold: number;
  private readonly stepThreshold: number;
  private armed = true;
  private centerFrames = 0;
  private candidate: LaneDirection = 0;
  private candidateFrames = 0;
  private lastStepAt = -Infinity;

  constructor(options: { centerThreshold?: number; stepThreshold?: number } = {}) {
    this.centerThreshold = options.centerThreshold ?? 0.055;
    this.stepThreshold = options.stepThreshold ?? 0.11;
  }

  reset(armed = true) {
    this.armed = armed;
    this.centerFrames = 0;
    this.candidate = 0;
    this.candidateFrames = 0;
    this.lastStepAt = -Infinity;
  }

  update(centerDeltaX: number, now: number): LaneDirection {
    if (!Number.isFinite(centerDeltaX) || !Number.isFinite(now)) return 0;
    if (Math.abs(centerDeltaX) < this.centerThreshold) {
      this.centerFrames++;
      if (this.centerFrames >= 2) this.armed = true;
      this.candidate = 0;
      this.candidateFrames = 0;
      return 0;
    }
    this.centerFrames = 0;
    const direction: LaneDirection = centerDeltaX <= -this.stepThreshold ? -1 : centerDeltaX >= this.stepThreshold ? 1 : 0;
    if (direction !== this.candidate) {
      this.candidate = direction;
      this.candidateFrames = direction === 0 ? 0 : 1;
    } else if (direction !== 0) this.candidateFrames++;
    if (!this.armed || direction === 0 || this.candidateFrames < 2 || now - this.lastStepAt < 420) return 0;
    this.armed = false;
    this.lastStepAt = now;
    return direction;
  }
}
