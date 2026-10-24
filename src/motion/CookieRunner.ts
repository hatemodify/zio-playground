const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 425;
const HERO_X = 190;
const FINISH = 1200;

type Phase = 'ready' | 'running' | 'paused' | 'won' | 'lost';
type Obstacle = { id: number; x: number; kind: 'stump' | 'branch'; passed: boolean };
type Treat = { id: number; x: number; y: number; taken: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
export type CookieRunnerEvent = 'treat' | 'hit' | 'stage' | 'won' | 'lost';
export type CookieRunnerStats = { phase: Phase; distance: number; finish: number; score: number; hearts: number; treats: number; stage: number; fps: number };

export function obstacleIsDangerous(kind: Obstacle['kind'], jumpHeight: number, sliding: boolean): boolean {
  return kind === 'stump' ? jumpHeight > -64 : !sliding;
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, line = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
}
function star(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, rotation = 0) {
  ctx.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = rotation - Math.PI / 2 + point * Math.PI / 5;
    const size = point % 2 ? radius * .48 : radius;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

export class CookieRunner {
  private ctx: CanvasRenderingContext2D;
  private phase: Phase = 'ready';
  private distance = 0;
  private score = 0;
  private hearts = 3;
  private treats = 0;
  private jumpY = 0;
  private velocityY = 0;
  private slidingUntil = 0;
  private invulnerableUntil = 0;
  private obstacles: Obstacle[] = [];
  private treatsOnRoad: Treat[] = [];
  private sparks: Spark[] = [];
  private spawnIn = 2.5;
  private id = 0;
  private lastTick = 0;
  private frames = 0;
  private fpsStart = 0;
  private fps = 0;
  private lastStage = 1;
  private onEvent?: (event: CookieRunnerEvent) => void;
  private jumpOnly = false;

  constructor(canvas: HTMLCanvasElement, onEvent?: (event: CookieRunnerEvent) => void) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('게임 화면을 열 수 없습니다.');
    this.ctx = context;
    this.onEvent = onEvent;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }

  get stats(): CookieRunnerStats {
    return { phase: this.phase, distance: Math.min(FINISH, Math.floor(this.distance)), finish: FINISH, score: this.score, hearts: this.hearts, treats: this.treats, stage: Math.min(3, Math.floor(this.distance / 400) + 1), fps: this.fps };
  }

  setJumpOnly(value: boolean) { this.jumpOnly = value; }

  reset() {
    this.phase = 'ready'; this.distance = 0; this.score = 0; this.hearts = 3; this.treats = 0;
    this.jumpY = 0; this.velocityY = 0; this.slidingUntil = 0; this.invulnerableUntil = 0;
    this.obstacles = []; this.treatsOnRoad = []; this.sparks = []; this.spawnIn = 2.5;
    this.id = 0; this.lastTick = 0; this.lastStage = 1;
  }
  start() { this.reset(); this.phase = 'running'; }
  pause() { if (this.phase === 'running') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') { this.phase = 'running'; this.lastTick = 0; } }
  jump() {
    if (this.phase !== 'running' || this.jumpY !== 0 || this.velocityY !== 0) return false;
    this.slidingUntil = 0;
    this.velocityY = -760;
    this.burst(HERO_X - 10, GROUND - 12, '#fff1a3', 9);
    return true;
  }
  slide(now: number) {
    if (this.phase !== 'running' || this.jumpY < 0) return false;
    this.slidingUntil = Math.max(this.slidingUntil, now + 650);
    return true;
  }

  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count;
      this.sparks.push({ x, y, vx: Math.cos(angle) * (60 + Math.random() * 100), vy: Math.sin(angle) * (60 + Math.random() * 100), life: .55, color });
    }
  }

  private spawn(stage: number) {
    const x = WIDTH + 70;
    const kind: Obstacle['kind'] = this.jumpOnly ? 'stump' : this.id % (stage === 1 ? 4 : 3) === 2 ? 'branch' : 'stump';
    this.obstacles.push({ id: ++this.id, x, kind, passed: false });
    const treatY = kind === 'stump' ? GROUND - 138 : GROUND - 29;
    for (let i = 0; i < 3; i++) this.treatsOnRoad.push({ id: ++this.id, x: x + 105 + i * 45, y: treatY, taken: false });
  }

  draw(now: number) {
    const dt = this.lastTick ? Math.min((now - this.lastTick) / 1000, .05) : 0;
    this.lastTick = now;
    this.frames++;
    if (!this.fpsStart) this.fpsStart = now;
    if (now - this.fpsStart >= 1000) { this.fps = Math.round(this.frames * 1000 / (now - this.fpsStart)); this.frames = 0; this.fpsStart = now; }
    if (this.phase === 'running') this.update(dt, now);
    this.paint(now);
  }

  private update(dt: number, now: number) {
    const stage = this.stats.stage;
    const speed = 285 + (stage - 1) * 40;
    this.distance += dt * (26 + (stage - 1) * 5);
    if (stage > this.lastStage) { this.lastStage = stage; this.onEvent?.('stage'); }
    this.velocityY += 1850 * dt;
    this.jumpY = Math.min(0, this.jumpY + this.velocityY * dt);
    if (this.jumpY === 0) this.velocityY = 0;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.distance < FINISH - 95) {
      this.spawn(stage);
      this.spawnIn = Math.max(1.7, 2.6 - (stage - 1) * .4) + Math.random() * .4;
    }
    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;
      if (obstacle.passed || Math.abs(obstacle.x - HERO_X) >= 37) continue;
      obstacle.passed = true;
      if (obstacleIsDangerous(obstacle.kind, this.jumpY, now < this.slidingUntil)) {
        if (now >= this.invulnerableUntil) {
          this.hearts--; this.invulnerableUntil = now + 1400;
          this.burst(HERO_X, GROUND - 65 + this.jumpY, '#fff1af', 18);
          this.onEvent?.('hit');
        }
      } else { this.score += 10; this.burst(obstacle.x, GROUND - 82, '#b4f9dc', 5); }
    }
    for (const treat of this.treatsOnRoad) {
      treat.x -= speed * dt;
      if (treat.taken || Math.abs(treat.x - HERO_X) > 38 || Math.abs(treat.y - (GROUND - 65 + this.jumpY)) > 56) continue;
      treat.taken = true; this.treats++; this.score += 25;
      this.burst(treat.x, treat.y, '#ffcf49', 8); this.onEvent?.('treat');
    }
    this.obstacles = this.obstacles.filter(item => item.x > -80);
    this.treatsOnRoad = this.treatsOnRoad.filter(item => item.x > -60 && !item.taken);
    for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += 190 * dt; spark.life -= dt; }
    this.sparks = this.sparks.filter(item => item.life > 0);
    if (this.hearts <= 0) { this.phase = 'lost'; this.onEvent?.('lost'); }
    else if (this.distance >= FINISH) { this.distance = FINISH; this.phase = 'won'; this.score += this.hearts * 100; this.onEvent?.('won'); }
  }

  private paint(now: number) {
    const ctx = this.ctx;
    const stage = this.stats.stage;
    const skies = [
      ['#60c9eb', '#ade8ef', '#ffe8bf'],
      ['#587dcc', '#91bee6', '#d9f1eb'],
      ['#fa91b7', '#ffc2ad', '#fff0bd'],
    ] as const;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, skies[stage - 1][0]); sky.addColorStop(.48, skies[stage - 1][1]); sky.addColorStop(1, skies[stage - 1][2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    circle(ctx, 777, 103, 72, 'rgba(255,242,192,.15)'); circle(ctx, 777, 103, 52, stage === 2 ? '#f5f4e9' : '#fff0bf');
    if (stage === 2) for (let i = 0; i < 16; i++) star(ctx, (i * 187 + 57) % WIDTH, 36 + (i * 59) % 215, 2 + i % 3, '#fff5cc', now / 1400 + i);
    this.clouds(ctx, this.distance * .38);
    this.hills(ctx, this.distance * .62);
    this.trees(ctx, this.distance * 1.8, stage);
    this.ground(ctx);
    for (const treat of this.treatsOnRoad) this.drawTreat(ctx, treat, now);
    for (const obstacle of this.obstacles) this.drawObstacle(ctx, obstacle);
    this.hero(ctx, now);
    for (const spark of this.sparks) { ctx.globalAlpha = Math.max(0, spark.life / .55); circle(ctx, spark.x, spark.y, 4, spark.color); }
    ctx.globalAlpha = 1;
    if (this.phase !== 'running') {
      ctx.fillStyle = this.phase === 'ready' ? 'rgba(38,25,77,.08)' : 'rgba(38,25,77,.32)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  private clouds(ctx: CanvasRenderingContext2D, offset: number) {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 230 - offset) % 1380 + 1380) % 1380 - 120;
      const y = 78 + i % 3 * 55;
      circle(ctx, x, y, 25, 'rgba(255,255,255,.72)'); circle(ctx, x + 29, y - 10, 32, 'rgba(255,255,255,.82)'); circle(ctx, x + 59, y + 2, 23, 'rgba(255,255,255,.72)');
      rounded(ctx, x - 8, y, 78, 20, 10, 'rgba(255,255,255,.72)');
    }
  }
  private hills(ctx: CanvasRenderingContext2D, offset: number) {
    ctx.fillStyle = '#ad99d4';
    for (let i = -1; i < 7; i++) { const x = i * 190 - offset % 190; ctx.beginPath(); ctx.ellipse(x, 377, 142, 116, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#72c6ac';
    for (let i = -1; i < 7; i++) { const x = i * 210 - offset * 1.3 % 210; ctx.beginPath(); ctx.ellipse(x, 410, 147, 76, 0, Math.PI, 0); ctx.fill(); }
  }
  private trees(ctx: CanvasRenderingContext2D, offset: number, stage: number) {
    const canopy = stage === 2 ? ['#57b7ce', '#79d3d3', '#b1eee0'] : stage === 3 ? ['#ee7f97', '#ffabc1', '#ffd5ad'] : ['#d965a7', '#f483b5', '#ffb9cf'];
    for (let i = -1; i < 8; i++) {
      const x = i * 185 - offset % 185;
      rounded(ctx, x - 7, 282, 15, 120, 7, '#99617c');
      circle(ctx, x - 18, 285, 39, canopy[0]); circle(ctx, x + 19, 275, 42, canopy[1]); circle(ctx, x, 249, 42, canopy[2]);
      ctx.strokeStyle = 'rgba(255,223,242,.65)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, 266, 28, .15, Math.PI * 1.5); ctx.stroke();
      circle(ctx, x - 18, 263, 5, '#fff5b7'); circle(ctx, x + 22, 284, 5, '#fff5b7');
    }
  }
  private ground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#a9e88e'; ctx.fillRect(0, GROUND - 12, WIDTH, 20);
    ctx.fillStyle = '#50b881'; ctx.fillRect(0, GROUND + 6, WIDTH, 10);
    const soil = ctx.createLinearGradient(0, GROUND + 15, 0, HEIGHT);
    soil.addColorStop(0, '#b97975'); soil.addColorStop(1, '#8d6188');
    ctx.fillStyle = soil; ctx.fillRect(0, GROUND + 16, WIDTH, HEIGHT - GROUND - 16);
    const scroll = this.distance * 8;
    for (let i = -1; i < 16; i++) {
      const x = i * 84 - scroll % 84;
      rounded(ctx, x + 15, GROUND + 36, 31, 8, 4, '#ca8b84');
      rounded(ctx, x + 44, GROUND + 79, 21, 6, 3, '#b97875');
      circle(ctx, x + 12, GROUND + 98, 3, '#e2a99c');
    }
  }
  private drawTreat(ctx: CanvasRenderingContext2D, treat: Treat, now: number) {
    const y = treat.y + Math.sin(now / 220 + treat.id) * 4;
    circle(ctx, treat.x, y, 23, 'rgba(255,240,155,.24)');
    star(ctx, treat.x, y, 16, '#fff5a6', now / 700); star(ctx, treat.x, y, 11, '#ffd451', now / 700);
    circle(ctx, treat.x - 4, y - 5, 2.5, '#fff');
  }
  private drawObstacle(ctx: CanvasRenderingContext2D, item: Obstacle) {
    const x = item.x;
    if (item.kind === 'stump') {
      rounded(ctx, x - 28, GROUND - 45, 57, 48, 12, '#6d3f65', '#4d315d', 5);
      rounded(ctx, x - 24, GROUND - 52, 49, 17, 9, '#c47c75', '#654365', 4);
      circle(ctx, x - 7, GROUND - 43, 6, '#eab69a'); circle(ctx, x + 12, GROUND - 44, 4, '#eab69a');
      rounded(ctx, x - 16, GROUND - 21, 8, 5, 2, '#e8b193');
    } else {
      rounded(ctx, x - 9, GROUND - 126, 18, 46, 8, '#705071');
      circle(ctx, x, GROUND - 115, 27, '#bb6c98');
      circle(ctx, x - 14, GROUND - 119, 12, '#ed9ac0'); circle(ctx, x + 12, GROUND - 128, 11, '#f4b1cb');
      circle(ctx, x, GROUND - 112, 8, '#fff2b8');
    }
  }
  private hero(ctx: CanvasRenderingContext2D, now: number) {
    const sliding = now < this.slidingUntil && this.jumpY === 0;
    const bob = this.phase === 'running' && !sliding && this.jumpY === 0 ? Math.sin(now / 85) * 3 : 0;
    const y = GROUND + this.jumpY + bob;
    ctx.globalAlpha = this.invulnerableUntil > now && Math.floor(now / 90) % 2 ? .43 : 1;
    ctx.fillStyle = 'rgba(41,37,70,.24)'; ctx.beginPath(); ctx.ellipse(HERO_X + 2, GROUND + 10, 40 - this.jumpY * .05, 9, 0, 0, Math.PI * 2); ctx.fill();
    if (sliding) {
      rounded(ctx, HERO_X - 39, y - 42, 76, 39, 18, '#bd7850', '#754466', 5);
      rounded(ctx, HERO_X - 22, y - 33, 46, 18, 9, '#f4ca89');
      circle(ctx, HERO_X + 15, y - 30, 3, '#423052');
      rounded(ctx, HERO_X + 22, y - 19, 25, 11, 5, '#e6f3d4', '#725372', 3);
    } else {
      const step = this.jumpY < 0 ? 0 : Math.sin(now / 75) * 7;
      rounded(ctx, HERO_X - 25, y - 33, 18, 30 + step, 8, '#ab6753', '#764666', 4);
      rounded(ctx, HERO_X + 7, y - 33, 18, 30 - step, 8, '#ab6753', '#764666', 4);
      rounded(ctx, HERO_X - 32, y - 82, 64, 57, 24, '#bc7955', '#754768', 5);
      rounded(ctx, HERO_X - 22, y - 68, 44, 28, 14, '#f5cc8e');
      rounded(ctx, HERO_X - 47, y - 76, 24, 17, 8, '#bc7955', '#754768', 4);
      rounded(ctx, HERO_X + 24, y - 75, 24, 17, 8, '#bc7955', '#754768', 4);
      circle(ctx, HERO_X - 5, y - 61, 4, '#fff0c8'); circle(ctx, HERO_X + 8, y - 61, 4, '#fff0c8');
      circle(ctx, HERO_X, y - 110, 40, '#754768'); circle(ctx, HERO_X, y - 112, 35, '#c68458');
      rounded(ctx, HERO_X - 36, y - 143, 72, 20, 10, '#fff0d4');
      circle(ctx, HERO_X - 21, y - 137, 13, '#fff0d4'); circle(ctx, HERO_X + 15, y - 138, 15, '#fff0d4');
      circle(ctx, HERO_X - 13, y - 118, 5, '#46314d'); circle(ctx, HERO_X + 13, y - 118, 5, '#46314d');
      circle(ctx, HERO_X - 20, y - 107, 5, '#ed9a93'); circle(ctx, HERO_X + 21, y - 107, 5, '#ed9a93');
      ctx.strokeStyle = '#69435c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(HERO_X, y - 110, 10, .25, Math.PI - .25); ctx.stroke();
      rounded(ctx, HERO_X + 17, y - 82, 27, 11, 5, '#8de0b7');
    }
    ctx.globalAlpha = 1;
  }
}
