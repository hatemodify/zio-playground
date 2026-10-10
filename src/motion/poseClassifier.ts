export type Landmark = { x: number; y: number; visibility: number };
export type PoseAction = 'NONE' | 'JUMP' | 'CROUCH' | 'LEFT' | 'RIGHT';
export type PoseState = 'NO_BODY' | 'CALIBRATING' | 'STANDING' | 'JUMPING' | 'CROUCHING' | 'MOVING_LEFT' | 'MOVING_RIGHT';
export type PoseSnapshot = {
  state: PoseState;
  action: PoseAction;
  bodyDetected: boolean;
  confidence: number;
  hipDeltaY: number;
  shoulderDeltaY: number;
  centerDeltaX: number;
  calibrationProgress: number;
  lastActionAt: number | null;
  message: string;
};

type Sample = { shoulderY: number; hipY: number; kneeY: number; ankleY: number; centerX: number; bodyHeight: number; kneeGap: number };
const average = (a: number, b: number) => (a + b) / 2;
const initial: PoseSnapshot = { state: 'NO_BODY', action: 'NONE', bodyDetected: false, confidence: 0, hipDeltaY: 0, shoulderDeltaY: 0, centerDeltaX: 0, calibrationProgress: 0, lastActionAt: null, message: '전신이 보이도록 뒤로 이동해 주세요.' };

function sample(points: Landmark[]): { value: Sample; confidence: number } | null {
  if (points.length !== 8) return null;
  const confidence = Math.min(...points.map(point => point.visibility));
  if (confidence < 0.55 || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return null;
  const shoulderY = average(points[0].y, points[1].y);
  const hipY = average(points[2].y, points[3].y);
  const kneeY = average(points[4].y, points[5].y);
  const ankleY = average(points[6].y, points[7].y);
  const centerX = (points[0].x + points[1].x + points[2].x + points[3].x) / 4;
  const bodyHeight = ankleY - shoulderY;
  if (bodyHeight < 0.34 || shoulderY < 0.035 || ankleY > 0.965 || Math.min(...points.map(point => point.x)) < 0.025 || Math.max(...points.map(point => point.x)) > 0.975) return null;
  return { value: { shoulderY, hipY, kneeY, ankleY, centerX, bodyHeight, kneeGap: kneeY - hipY }, confidence };
}

export class PoseClassifier {
  private baseline: Sample | null = null;
  private calibration: Sample[] = [];
  private calibrationStart = 0;
  private smooth: Sample | null = null;
  private recent: Sample[] = [];
  private candidate: PoseAction = 'NONE';
  private candidateFrames = 0;
  private lastPulse = 0;
  private lastActionAt: number | null = null;
  private lastSeen = 0;
  private lastOutput: PoseSnapshot = initial;

  reset() {
    this.baseline = null;
    this.calibration = [];
    this.calibrationStart = 0;
    this.smooth = null;
    this.recent = [];
    this.candidate = 'NONE';
    this.candidateFrames = 0;
    this.lastPulse = 0;
    this.lastSeen = 0;
    this.lastOutput = { ...initial, lastActionAt: this.lastActionAt };
  }

  update(points: Landmark[], now: number): PoseSnapshot {
    const found = sample(points);
    if (!found) {
      if (this.lastSeen && now - this.lastSeen > 350) this.reset();
      this.candidate = 'NONE';
      this.candidateFrames = 0;
      this.lastOutput = { ...initial, lastActionAt: this.lastActionAt };
      return this.lastOutput;
    }
    this.lastSeen = now;
    const current = found.value;
    if (!this.baseline) {
      if (current.kneeGap / current.bodyHeight < 0.18) {
        this.calibration = [];
        this.calibrationStart = 0;
        return { ...initial, state: 'CALIBRATING', bodyDetected: true, confidence: found.confidence, message: '보정할 때는 무릎을 펴고 서 주세요.' };
      }
      if (current.centerX < 0.38 || current.centerX > 0.62) {
        this.calibration = [];
        this.calibrationStart = 0;
        return { ...initial, state: 'CALIBRATING', bodyDetected: true, confidence: found.confidence, message: '화면 중앙에 서 주세요.' };
      }
      if (this.calibration.length && (Math.abs(current.centerX - this.calibration[0].centerX) > 0.035 || Math.abs(current.hipY - this.calibration[0].hipY) > 0.035)) {
        this.calibration = [];
        this.calibrationStart = 0;
      }
      if (!this.calibrationStart) this.calibrationStart = now;
      this.calibration.push(current);
      const progress = Math.min(1, (now - this.calibrationStart) / 2500);
      if (progress < 1 || this.calibration.length < 15) {
        return { ...initial, state: 'CALIBRATING', bodyDetected: true, confidence: found.confidence, calibrationProgress: progress, message: '화면 중앙에 똑바로 서서 잠깐 기다려 주세요.' };
      }
      const field = (key: keyof Sample) => this.calibration.reduce((sum, item) => sum + item[key], 0) / this.calibration.length;
      this.baseline = { shoulderY: field('shoulderY'), hipY: field('hipY'), kneeY: field('kneeY'), ankleY: field('ankleY'), centerX: field('centerX'), bodyHeight: field('bodyHeight'), kneeGap: field('kneeGap') };
      this.smooth = current;
      this.calibration = [];
    }
    const base = this.baseline;
    const prev = this.smooth ?? current;
    const alpha = 0.6;
    const smoothed = Object.fromEntries((Object.keys(current) as (keyof Sample)[]).map(key => [key, prev[key] + alpha * (current[key] - prev[key])])) as Sample;
    this.smooth = smoothed;
    this.recent.push(smoothed);
    if (this.recent.length > 5) this.recent.shift();
    const old = this.recent[0];
    const scale = base.bodyHeight;
    const hipDeltaY = (smoothed.hipY - base.hipY) / scale;
    const shoulderDeltaY = (smoothed.shoulderY - base.shoulderY) / scale;
    const centerDeltaX = (smoothed.centerX - base.centerX) / scale;
    const hipVelocity = (smoothed.hipY - old.hipY) / scale;
    const centerVelocity = (smoothed.centerX - old.centerX) / scale;
    const kneeCompression = (base.kneeGap - smoothed.kneeGap) / scale;
    let proposed: PoseAction = 'NONE';
    if (hipDeltaY < -0.10 && shoulderDeltaY < -0.07 && (hipVelocity < -0.015 || this.lastOutput.state === 'JUMPING')) proposed = 'JUMP';
    else if (hipDeltaY > 0.06 && kneeCompression > 0.045) proposed = 'CROUCH';
    else if (centerDeltaX < -0.10 && (centerVelocity < -0.008 || this.lastOutput.state === 'MOVING_LEFT')) proposed = 'LEFT';
    else if (centerDeltaX > 0.10 && (centerVelocity > 0.008 || this.lastOutput.state === 'MOVING_RIGHT')) proposed = 'RIGHT';
    if (proposed === this.candidate) this.candidateFrames++;
    else { this.candidate = proposed; this.candidateFrames = 1; }
    const stable = this.candidateFrames >= 2 ? proposed : 'NONE';
    let action: PoseAction = stable;
    if (stable === 'JUMP' || stable === 'CROUCH') {
      const cooldown = stable === 'JUMP' ? 700 : 550;
      if (this.lastOutput.state === (stable === 'JUMP' ? 'JUMPING' : 'CROUCHING') || now - this.lastPulse < cooldown) action = 'NONE';
      else { this.lastPulse = now; this.lastActionAt = now; }
    } else if (stable === 'LEFT' || stable === 'RIGHT') this.lastActionAt = now;
    const state: PoseState = stable === 'JUMP' ? 'JUMPING' : stable === 'CROUCH' ? 'CROUCHING' : stable === 'LEFT' ? 'MOVING_LEFT' : stable === 'RIGHT' ? 'MOVING_RIGHT' : 'STANDING';
    this.lastOutput = { state, action, bodyDetected: true, confidence: found.confidence, hipDeltaY, shoulderDeltaY, centerDeltaX, calibrationProgress: 1, lastActionAt: this.lastActionAt, message: '' };
    return this.lastOutput;
  }
}
