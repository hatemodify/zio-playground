import { useSettingsStore } from '@/stores/settings-store';

const WIDTH = 800;
const HEIGHT = 480;
const HORIZON = 112;
const ROAD_BOTTOM = 480;
const FINISH_METERS = 1800;
const LANES = [-0.68, 0, 0.68] as const;
const LANE_CHANGE_MS = 260;

type Traffic = { id: number; lane: number; depth: number; kind: 'car' | 'coin'; color: 'red' | 'green'; checked: boolean; collected: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
export type RacePhase = 'ready' | 'running' | 'paused' | 'won' | 'lost';
export type RaceEvent = 'hit' | 'coin' | 'stage' | 'won' | 'lost';
export type RaceStats = { phase: RacePhase; distance: number; finish: number; score: number; hearts: number; stage: number; speed: number; coins: number; fps: number; lane: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roadHalf = (y: number) => 95 + (y - HORIZON) / (ROAD_BOTTOM - HORIZON) * 235;
const roadCenter = (y: number, distance: number) => WIDTH / 2 + Math.sin(distance / 340 + (HEIGHT - y) / 280) * (y - HORIZON) * 0.075;

function loadCar(color: 'blue' | 'red' | 'green') {
  const image = new Image();
  image.src = `/assets/kenney/cars/car-${color}.png`;
  return image;
}

export class TiltRace {
  private ctx: CanvasRenderingContext2D;
  private sprites = { blue: loadCar('blue'), red: loadCar('red'), green: loadCar('green') };
  private phase: RacePhase = 'ready';
  private distance = 0;
  private score = 0;
  private hearts = 3;
  private coins = 0;
  private targetLane = 1;
  private carPosition = 0;
  private laneStartPosition = 0;
  private laneChangeStartedAt = 0;
  private speed = 0;
  private impactUntil = 0;
  private traffic: Traffic[] = [];
  private sparks: Spark[] = [];
  private nextSpawn = 0;
  private objectId = 0;
  private invulnerableUntil = 0;
  private lastTick = 0;
  private frameCount = 0;
  private fpsStart = 0;
  private fps = 0;
  private lastStage = 1;
  private onEvent?: (event: RaceEvent) => void;
  private pendingPoseCapture: number | null = null;
  private poseLatencies: number[] = [];
  poseLatencyMs: number | null = null;

  constructor(canvas: HTMLCanvasElement, onEvent?: (event: RaceEvent) => void) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('레이싱 화면을 준비할 수 없습니다.');
    this.ctx = ctx;
    this.onEvent = onEvent;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }

  get stats(): RaceStats {
    const stage = Math.min(3, Math.floor(this.distance / 600) + 1);
    return { phase: this.phase, distance: Math.floor(this.distance), finish: FINISH_METERS, score: this.score, hearts: this.hearts, stage, speed: this.phase === 'running' ? Math.round(this.speed) : 0, coins: this.coins, fps: this.fps, lane: this.targetLane + 1 };
  }

  start() {
    this.distance = 0;
    this.score = 0;
    this.hearts = 3;
    this.coins = 0;
    this.targetLane = 1;
    this.carPosition = 0;
    this.laneStartPosition = 0;
    this.laneChangeStartedAt = 0;
    this.speed = 55;
    this.impactUntil = 0;
    this.traffic = [];
    this.sparks = [];
    this.nextSpawn = 0.8;
    this.objectId = 0;
    this.invulnerableUntil = 0;
    this.lastStage = 1;
    this.lastTick = 0;
    this.pendingPoseCapture = null;
    this.poseLatencies = [];
    this.poseLatencyMs = null;
    this.phase = 'running';
  }

  pause() { if (this.phase === 'running') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') { this.lastTick = 0; this.phase = 'running'; } }
  moveLane(direction: -1 | 1, capturedAt?: number) {
    if (this.phase !== 'running') return false;
    const nextLane = clamp(this.targetLane + direction, 0, LANES.length - 1);
    if (nextLane === this.targetLane) return false;
    this.laneStartPosition = this.carPosition;
    this.targetLane = nextLane;
    this.laneChangeStartedAt = performance.now();
    if (capturedAt !== undefined) this.pendingPoseCapture = capturedAt;
    return true;
  }

  private burst(x: number, y: number, color: string) {
    for (let index = 0; index < 18; index++) {
      const angle = index * Math.PI * 2 / 18;
      const speed = 70 + Math.random() * 130;
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.65, color });
    }
  }

  private spawn() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const kind = this.objectId % 4 === 3 ? 'coin' : 'car';
    this.traffic.push({ id: ++this.objectId, lane, depth: 0.025, kind, color: Math.random() < 0.5 ? 'red' : 'green', checked: false, collected: false });
  }

  draw(now: number) {
    const dt = this.lastTick ? clamp((now - this.lastTick) / 1000, 0, 0.05) : 0;
    this.lastTick = now;
    this.frameCount++;
    if (!this.fpsStart) this.fpsStart = now;
    if (now - this.fpsStart >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.fpsStart));
      this.frameCount = 0;
      this.fpsStart = now;
    }

    if (this.phase === 'running') {
      const stage = Math.min(3, Math.floor(this.distance / 600) + 1);
      const targetSpeed = 126 + (stage - 1) * 20;
      this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 1.45);
      this.distance = Math.min(FINISH_METERS, this.distance + this.speed / 3.6 * dt);
      const laneProgress = clamp((now - this.laneChangeStartedAt) / LANE_CHANGE_MS, 0, 1);
      const easedLaneProgress = laneProgress * laneProgress * (3 - 2 * laneProgress);
      this.carPosition = this.laneStartPosition + (LANES[this.targetLane] - this.laneStartPosition) * easedLaneProgress;
      if (this.pendingPoseCapture !== null) {
        this.poseLatencies.push(now - this.pendingPoseCapture);
        if (this.poseLatencies.length > 30) this.poseLatencies.shift();
        this.poseLatencyMs = Math.round(this.poseLatencies.reduce((sum, value) => sum + value, 0) / this.poseLatencies.length);
        this.pendingPoseCapture = null;
      }
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        this.spawn();
        this.nextSpawn = Math.max(0.85, 1.65 - stage * 0.18) + Math.random() * 0.42;
      }
      for (const item of this.traffic) {
        item.depth += dt * (0.205 + (stage - 1) * 0.032) * (this.speed / targetSpeed);
        if (!item.checked && item.depth >= 0.86) {
          item.checked = true;
          if (Math.abs(item.lane - this.carPosition) < (item.kind === 'coin' ? 0.31 : 0.34)) {
            const pointY = HORIZON + Math.pow(item.depth, 1.45) * (HEIGHT - HORIZON);
            const pointX = roadCenter(pointY, this.distance) + item.lane * roadHalf(pointY) * 0.73;
            if (item.kind === 'coin') {
              item.collected = true;
              this.coins++;
              this.score += 75;
              this.burst(pointX, pointY, '#ffe58a');
              this.onEvent?.('coin');
            } else if (now >= this.invulnerableUntil) {
              this.hearts--;
              this.invulnerableUntil = now + 1400;
              this.impactUntil = now + 430;
              this.speed = Math.max(55, this.speed * 0.67);
              this.burst(pointX, pointY, '#ff8293');
              this.onEvent?.('hit');
            }
          }
        }
      }
      this.traffic = this.traffic.filter(item => item.depth < 1.18 && !item.collected);
      this.score = Math.max(this.score, Math.floor(this.distance / 4) + this.coins * 75);
      const nextStage = Math.min(3, Math.floor(this.distance / 600) + 1);
      if (nextStage > this.lastStage) { this.lastStage = nextStage; this.onEvent?.('stage'); }
      if (this.hearts <= 0) { this.phase = 'lost'; this.onEvent?.('lost'); }
      else if (this.distance >= FINISH_METERS) { this.phase = 'won'; this.score += this.hearts * 200; this.onEvent?.('won'); }
    }

    this.sparks = this.sparks.filter(spark => spark.life > 0);
    for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += 140 * dt; spark.life -= dt; }
    this.render(now);
  }

  private render(now: number) {
    const ctx = this.ctx;
    const english = useSettingsStore.getState().language === 'en';
    const impact = clamp((this.impactUntil - now) / 430, 0, 1);
    ctx.save();
    ctx.fillStyle = '#17244d'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (impact > 0) ctx.translate(Math.sin(now * 0.18) * impact * 8, Math.cos(now * 0.21) * impact * 5);
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#17244d'); sky.addColorStop(0.34, '#493c77'); sky.addColorStop(0.66, '#f39a76'); sky.addColorStop(1, '#eecf9b');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ffc68f'; ctx.beginPath(); ctx.arc(630, 105, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7b6992';
    for (let x = -100; x < WIDTH + 100; x += 135) {
      ctx.beginPath(); ctx.moveTo(x, HORIZON + 22); ctx.lineTo(x + 70, 66 + (x % 3) * 8); ctx.lineTo(x + 150, HORIZON + 22); ctx.fill();
    }
    ctx.fillStyle = '#324e66'; ctx.fillRect(0, HORIZON + 17, WIDTH, HEIGHT);
    ctx.fillStyle = '#375c65';
    for (let index = 0; index < 7; index++) {
      const depth = (index / 7 + this.distance / 120) % 1;
      const y = HORIZON + Math.pow(depth, 1.7) * (HEIGHT - HORIZON);
      const size = 6 + depth * 44;
      const half = roadHalf(y);
      const center = roadCenter(y, this.distance);
      for (const side of [-1, 1]) {
        const x = center + side * (half + 18 + depth * 25);
        ctx.fillStyle = '#244b54'; ctx.fillRect(x - size * .08, y - size * .2, size * .16, size * .65);
        ctx.fillStyle = index % 3 === 0 ? '#ffbb99' : '#54c4a8';
        ctx.beginPath(); ctx.arc(x, y - size * .55, size * .38, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (let y = HORIZON; y < HEIGHT; y += 3) {
      const half = roadHalf(y);
      const center = roadCenter(y, this.distance);
      ctx.fillStyle = '#292f48'; ctx.fillRect(center - half, y, half * 2, 3);
      const stripe = Math.floor((y + this.distance * 2.8) / 24) % 2 === 0;
      ctx.fillStyle = stripe ? '#f4e2c4' : '#ec7a87';
      ctx.fillRect(center - half, y, 7 + (y - HORIZON) * .035, 3);
      ctx.fillRect(center + half - 7 - (y - HORIZON) * .035, y, 7 + (y - HORIZON) * .035, 3);
      if (Math.floor((y + this.distance * 2.8) / 35) % 3 !== 0) continue;
      ctx.fillStyle = '#d4d9e6';
      for (const lane of [-1 / 3, 1 / 3]) ctx.fillRect(center + lane * half - 1, y, 2 + (y - HORIZON) * .012, 4);
    }
    if (this.phase === 'running') {
      ctx.strokeStyle = 'rgba(255, 240, 210, .28)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 12; index++) {
        const depth = ((index * 0.093 + this.distance * 0.008) % 1 + 1) % 1;
        const y = HORIZON + Math.pow(depth, 1.45) * (HEIGHT - HORIZON);
        const half = roadHalf(y);
        const center = roadCenter(y, this.distance);
        for (const side of [-1, 1]) {
          const x = center + side * (half + 16 + depth * 18);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * depth * 12, y + 8 + depth * 26); ctx.stroke();
        }
      }
    }
    for (const item of this.traffic) {
      const depth = item.depth;
      const y = HORIZON + Math.pow(depth, 1.45) * (HEIGHT - HORIZON);
      const x = roadCenter(y, this.distance) + item.lane * roadHalf(y) * .73;
      const size = 14 + depth * 78;
      if (item.kind === 'coin') {
        const radius = size * .37;
        ctx.fillStyle = '#ffe89e'; ctx.beginPath(); ctx.arc(x, y - size * .3, radius + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffbd4d'; ctx.beginPath(); ctx.arc(x, y - size * .3, radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff2bc'; ctx.font = `900 ${Math.max(12, size * .42)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('★', x, y - size * .15); ctx.textAlign = 'start';
      } else {
        this.drawCar(this.sprites[item.color], x, y, size * .7, size * 1.2, false);
      }
    }
    const playerY = 411;
    const playerX = roadCenter(playerY, this.distance) + this.carPosition * roadHalf(playerY) * .73;
    const lean = clamp((LANES[this.targetLane] - this.carPosition) * 0.21, -0.13, 0.13);
    ctx.fillStyle = 'rgba(90, 226, 255, .17)';
    ctx.beginPath(); ctx.ellipse(playerX, playerY + 8, 49, 13, 0, 0, Math.PI * 2); ctx.fill();
    if (!(this.phase === 'running' && now < this.invulnerableUntil && Math.floor(now / 90) % 2 === 0)) {
      this.drawCar(this.sprites.blue, playerX, playerY, 76, 122, true, lean);
    }
    for (const spark of this.sparks) {
      ctx.globalAlpha = clamp(spark.life / .65, 0, 1);
      ctx.fillStyle = spark.color; ctx.fillRect(spark.x, spark.y, 6, 6);
    }
    ctx.globalAlpha = 1;
    if (impact > 0) {
      ctx.fillStyle = `rgba(255, 92, 100, ${impact * 0.18})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, 190);
    shade.addColorStop(0, 'rgba(14, 21, 48, .55)'); shade.addColorStop(1, 'rgba(14, 21, 48, 0)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, WIDTH, 190);
    if (this.phase !== 'running') {
      ctx.fillStyle = 'rgba(15, 21, 45, .66)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff9ec'; ctx.font = '900 48px system-ui';
      ctx.fillText(this.phase === 'won' ? 'FINISH!' : this.phase === 'lost' ? 'GAME OVER' : this.phase === 'paused' ? 'PAUSED' : 'BODY RACE', WIDTH / 2, 210);
      ctx.font = '700 21px system-ui'; ctx.fillStyle = '#c9f5e7';
      ctx.fillText(this.phase === 'won' ? (english ? 'What a finish! Race again?' : '멋진 완주! 다시 달려 볼까요?')
        : this.phase === 'lost' ? (english ? 'Try again and go farther!' : '다시 도전하면 더 멀리 갈 수 있어요')
        : this.phase === 'paused' ? (english ? 'Press Continue to race' : '계속하기를 눌러 주세요')
        : (english ? 'Move left or right · Dodge cars · Collect stars' : '몸을 좌우로 움직여 차량을 피하고 별을 모으세요'), WIDTH / 2, 252);
      ctx.textAlign = 'start';
    }
    ctx.restore();
  }

  private drawCar(image: HTMLImageElement, x: number, y: number, width: number, height: number, player: boolean, lean = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = player ? 'rgba(52, 216, 245, .36)' : 'rgba(0, 0, 0, .30)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, width * .48, height * .12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x, y - height / 2);
    ctx.rotate(lean);
    if (image.complete && image.naturalWidth > 0) ctx.drawImage(image, -width / 2, -height / 2, width, height);
    else { ctx.fillStyle = player ? '#40c5f1' : '#f17988'; ctx.fillRect(-width / 2, -height / 2, width, height); }
    ctx.restore();
  }
}
