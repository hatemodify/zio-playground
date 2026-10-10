import type { PoseSnapshot } from './poseClassifier';

const WIDTH = 640;
const HEIGHT = 260;
const GROUND = 215;
type Obstacle = { x: number; kind: 'low' | 'high'; passed: boolean };

export class Runner {
  private ctx: CanvasRenderingContext2D;
  private x = WIDTH / 2;
  private targetX = WIDTH / 2;
  private jumpY = 0;
  private velocityY = 0;
  private crouchUntil = 0;
  private obstacles: Obstacle[] = [];
  private spawnAt = 0;
  private lastTick = 0;
  private distance = 0;
  private hits = 0;
  private active = false;
  private remoteMode = false;
  private pendingCapture: number | null = null;
  private latencies: number[] = [];
  private frames = 0;
  private fpsStart = 0;
  fps = 0;
  latencyMs: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D 캔버스를 사용할 수 없습니다.');
    this.ctx = ctx;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }

  setRemoteActive(active: boolean) {
    this.remoteMode = true;
    this.active = active;
    this.targetX = WIDTH / 2;
    this.x = WIDTH / 2;
    if (!active) this.pendingCapture = null;
  }

  jumpFromRemote(receivedAt: number) {
    if (!this.active || this.jumpY !== 0) return;
    this.velocityY = -550;
    this.pendingCapture = receivedAt;
  }

  setPose(pose: PoseSnapshot, capturedAt: number) {
    this.active = pose.bodyDetected && pose.calibrationProgress === 1;
    if (!this.active) {
      this.targetX = WIDTH / 2;
      this.pendingCapture = null;
      return;
    }
    this.targetX = pose.state === 'MOVING_LEFT' || pose.state === 'MOVING_RIGHT'
      ? Math.max(42, Math.min(WIDTH - 42, WIDTH / 2 + pose.centerDeltaX * 520))
      : WIDTH / 2;
    const now = performance.now();
    if (pose.action === 'JUMP' && this.jumpY === 0) {
      this.velocityY = -550;
      this.pendingCapture = capturedAt;
    } else if (pose.action === 'CROUCH') {
      this.crouchUntil = now + 650;
      this.pendingCapture = capturedAt;
    } else if (pose.action === 'LEFT' || pose.action === 'RIGHT') {
      this.pendingCapture = capturedAt;
    }
  }

  draw(now: number) {
    const dt = this.lastTick ? Math.min((now - this.lastTick) / 1000, 0.05) : 0;
    this.lastTick = now;
    this.frames++;
    if (!this.fpsStart) this.fpsStart = now;
    if (now - this.fpsStart >= 1000) {
      this.fps = Math.round(this.frames * 1000 / (now - this.fpsStart));
      this.frames = 0;
      this.fpsStart = now;
    }
    if (this.active) {
      this.x += (this.targetX - this.x) * Math.min(1, dt * 24);
      this.jumpY = Math.min(0, this.jumpY + this.velocityY * dt);
      this.velocityY = this.jumpY === 0 ? 0 : this.velocityY + 1300 * dt;
      if (this.jumpY === 0 && this.velocityY > 0) this.velocityY = 0;
      this.distance += 160 * dt;
      if (now >= this.spawnAt) {
        this.obstacles.push({ x: WIDTH + 35, kind: this.remoteMode || Math.random() < 0.6 ? 'low' : 'high', passed: false });
        this.spawnAt = now + 2200 + Math.random() * 1200;
      }
      for (const obstacle of this.obstacles) {
        obstacle.x -= 160 * dt;
        const crouching = now < this.crouchUntil && this.jumpY === 0;
        const collision = Math.abs(obstacle.x - this.x) < 28 && (obstacle.kind === 'low' ? this.jumpY > -52 : !crouching);
        if (!obstacle.passed && obstacle.x < this.x - 30) obstacle.passed = true;
        if (collision && !obstacle.passed) { this.hits++; obstacle.passed = true; }
      }
      this.obstacles = this.obstacles.filter(item => item.x > -40);
      if (this.pendingCapture !== null) {
        this.latencies.push(now - this.pendingCapture);
        if (this.latencies.length > 30) this.latencies.shift();
        this.latencyMs = Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);
        this.pendingCapture = null;
      }
    }
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#10293d'); sky.addColorStop(1, '#1f5062');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#a7e8d8';
    for (let i = 0; i < 5; i++) {
      const px = ((i * 158 - this.distance * 0.16) % 790 + 790) % 790 - 40;
      ctx.beginPath(); ctx.arc(px, 92 + (i % 3) * 16, 20, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#335e59'; ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
    ctx.fillStyle = '#9ddd93'; ctx.fillRect(0, GROUND, WIDTH, 6);
    for (const obstacle of this.obstacles) {
      ctx.fillStyle = obstacle.kind === 'low' ? '#f6ab68' : '#db82af';
      const top = obstacle.kind === 'low' ? GROUND - 31 : GROUND - 68;
      ctx.fillRect(obstacle.x - 14, top, 28, obstacle.kind === 'low' ? 31 : 36);
    }
    const crouching = now < this.crouchUntil && this.jumpY === 0;
    const height = crouching ? 24 : 48;
    ctx.fillStyle = '#fef3a4'; ctx.fillRect(this.x - 17, GROUND - height + this.jumpY, 34, height);
    ctx.fillStyle = '#213548'; ctx.fillRect(this.x + 5, GROUND - height + 13 + this.jumpY, 5, 5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
    ctx.fillText(`거리 ${Math.floor(this.distance / 20)}   충돌 ${this.hits}`, 18, 27);
    if (!this.active) {
      ctx.fillStyle = 'rgba(4, 20, 32, .7)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = 'center'; ctx.font = 'bold 22px system-ui'; ctx.fillStyle = '#fff';
      ctx.fillText(this.remoteMode ? '컨트롤러가 연결되면 게임이 시작돼요' : '전신 인식과 보정이 끝나면 게임이 시작돼요', WIDTH / 2, HEIGHT / 2);
      ctx.textAlign = 'start';
    }
  }
}
