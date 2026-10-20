export type LaneDirection = -1 | 0 | 1;

/** A sidestep changes one lane; returning to the center only rearms the next step. */
export class RaceSidestepDetector {
  private armed = true;
  private centerFrames = 0;
  private candidate: LaneDirection = 0;
  private candidateFrames = 0;
  private lastStepAt = -Infinity;

  reset(armed = true) {
    this.armed = armed;
    this.centerFrames = 0;
    this.candidate = 0;
    this.candidateFrames = 0;
    this.lastStepAt = -Infinity;
  }

  update(centerDeltaX: number, now: number): LaneDirection {
    if (!Number.isFinite(centerDeltaX) || !Number.isFinite(now)) return 0;
    if (Math.abs(centerDeltaX) < 0.055) {
      this.centerFrames++;
      if (this.centerFrames >= 2) this.armed = true;
      this.candidate = 0;
      this.candidateFrames = 0;
      return 0;
    }
    this.centerFrames = 0;
    const direction: LaneDirection = centerDeltaX <= -0.11 ? -1 : centerDeltaX >= 0.11 ? 1 : 0;
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
