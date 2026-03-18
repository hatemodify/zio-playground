export type SketchCategory = 'animals' | 'vehicles' | 'nature' | 'objects';

export interface SketchData {
  id: string;
  name: string;
  emoji: string;
  category: SketchCategory;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const SKETCH_CATEGORIES: { key: SketchCategory; label: string; emoji: string }[] = [
  { key: 'animals', label: '동물', emoji: '🐾' },
  { key: 'vehicles', label: '탈것', emoji: '🚗' },
  { key: 'nature', label: '자연', emoji: '🌿' },
  { key: 'objects', label: '기타', emoji: '🎈' },
];

// --- Drawing functions ---

function drawDog(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.1, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  // Left ear
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.45, cy - s * 0.55, s * 0.2, s * 0.35, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.45, cy - s * 0.55, s * 0.2, s * 0.35, 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.arc(cx - s * 0.18, cy - s * 0.15, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.18, cy - s * 0.15, s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.08, s * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.16);
  ctx.quadraticCurveTo(cx - s * 0.15, cy + s * 0.3, cx - s * 0.25, cy + s * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.16);
  ctx.quadraticCurveTo(cx + s * 0.15, cy + s * 0.3, cx + s * 0.25, cy + s * 0.2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.75, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCat(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  // Left ear (triangle)
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.8);
  ctx.lineTo(cx - s * 0.1, cy - s * 0.45);
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.5, cy - s * 0.35);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.8);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.45);
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.2, cy - s * 0.05, s * 0.09, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.2, cy - s * 0.05, s * 0.09, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.17);
  ctx.lineTo(cx + s * 0.06, cy + s * 0.17);
  ctx.closePath();
  ctx.fill();

  // Whiskers
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.55, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.2, cy + s * 0.12);
  ctx.moveTo(cx - s * 0.55, cy + s * 0.2);
  ctx.lineTo(cx - s * 0.2, cy + s * 0.18);
  ctx.moveTo(cx + s * 0.55, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.12);
  ctx.moveTo(cx + s * 0.55, cy + s * 0.2);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.18);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.85, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRabbit(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2 + s * 0.15;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Left ear
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.2, cy - s * 0.95, s * 0.13, s * 0.45, -0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.2, cy - s * 0.95, s * 0.13, s * 0.45, 0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.arc(cx - s * 0.15, cy - s * 0.08, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.15, cy - s * 0.08, s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.1, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.14);
  ctx.lineTo(cx, cy + s * 0.22);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.8, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBear(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  // Left ear
  ctx.beginPath();
  ctx.arc(cx - s * 0.45, cy - s * 0.45, s * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.arc(cx + s * 0.45, cy - s * 0.45, s * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.arc(cx - s * 0.2, cy - s * 0.1, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.2, cy - s * 0.1, s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.12, s * 0.1, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.12, s * 0.2, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.85, s * 0.5, s * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFish(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.65, s * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.6, cy);
  ctx.lineTo(cx + s * 1.0, cy - s * 0.35);
  ctx.lineTo(cx + s * 1.0, cy + s * 0.35);
  ctx.closePath();
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(cx - s * 0.25, cy - s * 0.05, s * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(cx - s * 0.55, cy + s * 0.05, s * 0.08, -0.5, 0.5);
  ctx.stroke();

  // Fin
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.4);
  ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 0.75, cx + s * 0.3, cy - s * 0.35);
  ctx.stroke();
}

function drawBird(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.1, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy - s * 0.35, s * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  // Beak
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.55, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.55, cy - s * 0.25);
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(cx - s * 0.35, cy - s * 0.4, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.1, cy, s * 0.35, s * 0.2, 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.4, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.75, cy - s * 0.15);
  ctx.moveTo(cx + s * 0.4, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.7, cy + s * 0.05);
  ctx.stroke();
}

function drawButterfly(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.08, s * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Left upper wing
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.45, cy - s * 0.2, s * 0.4, s * 0.3, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Right upper wing
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.45, cy - s * 0.2, s * 0.4, s * 0.3, 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Left lower wing
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.35, cy + s * 0.25, s * 0.3, s * 0.2, -0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Right lower wing
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.35, cy + s * 0.25, s * 0.3, s * 0.2, 0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Antennae
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.03, cy - s * 0.45);
  ctx.quadraticCurveTo(cx - s * 0.2, cy - s * 0.75, cx - s * 0.25, cy - s * 0.65);
  ctx.moveTo(cx + s * 0.03, cy - s * 0.45);
  ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 0.75, cx + s * 0.25, cy - s * 0.65);
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Body
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.8, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.45, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.8, cy + s * 0.15);
  ctx.closePath();
  ctx.stroke();

  // Windows
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.4, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.25, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.25, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.1);
  ctx.stroke();
  // Center divider
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.38);
  ctx.lineTo(cx, cy - s * 0.1);
  ctx.stroke();

  // Wheels
  ctx.beginPath();
  ctx.arc(cx - s * 0.45, cy + s * 0.15, s * 0.17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.45, cy + s * 0.15, s * 0.17, 0, Math.PI * 2);
  ctx.stroke();

  // Ground line
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.9, cy + s * 0.32);
  ctx.lineTo(cx + s * 0.9, cy + s * 0.32);
  ctx.stroke();
}

function drawAirplane(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Fuselage
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.75, s * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Nose
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.75, cy);
  ctx.lineTo(cx + s * 0.95, cy);
  ctx.stroke();

  // Wings
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.18);
  ctx.lineTo(cx - s * 0.15, cy - s * 0.7);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.7);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy + s * 0.18);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.18);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.65, cy - s * 0.18);
  ctx.lineTo(cx - s * 0.8, cy - s * 0.5);
  ctx.lineTo(cx - s * 0.55, cy - s * 0.5);
  ctx.lineTo(cx - s * 0.5, cy - s * 0.18);
  ctx.stroke();

  // Windows
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * s * 0.15, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBoat(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Hull
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.45);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.45);
  ctx.lineTo(cx + s * 0.8, cy + s * 0.1);
  ctx.closePath();
  ctx.stroke();

  // Cabin
  ctx.beginPath();
  ctx.rect(cx - s * 0.35, cy - s * 0.25, s * 0.7, s * 0.35);
  ctx.stroke();

  // Mast
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.25);
  ctx.lineTo(cx, cy - s * 0.75);
  ctx.stroke();

  // Flag
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.75);
  ctx.lineTo(cx + s * 0.25, cy - s * 0.65);
  ctx.lineTo(cx, cy - s * 0.55);
  ctx.stroke();

  // Water
  ctx.beginPath();
  for (let x = -0.9; x <= 0.9; x += 0.3) {
    ctx.moveTo(cx + x * s, cy + s * 0.55);
    ctx.quadraticCurveTo(cx + (x + 0.15) * s, cy + s * 0.5, cx + (x + 0.3) * s, cy + s * 0.55);
  }
  ctx.stroke();
}

function drawRocket(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.9);
  ctx.quadraticCurveTo(cx + s * 0.35, cy - s * 0.5, cx + s * 0.3, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.4);
  ctx.quadraticCurveTo(cx - s * 0.35, cy - s * 0.5, cx, cy - s * 0.9);
  ctx.stroke();

  // Window
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.2, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  // Left fin
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy + s * 0.2);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.55);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.4);
  ctx.stroke();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy + s * 0.2);
  ctx.lineTo(cx + s * 0.55, cy + s * 0.55);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.4);
  ctx.stroke();

  // Flames
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy + s * 0.4);
  ctx.quadraticCurveTo(cx - s * 0.1, cy + s * 0.7, cx, cy + s * 0.85);
  ctx.quadraticCurveTo(cx + s * 0.1, cy + s * 0.7, cx + s * 0.15, cy + s * 0.4);
  ctx.stroke();
}

function drawTrain(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Engine body
  ctx.beginPath();
  ctx.rect(cx - s * 0.7, cy - s * 0.3, s * 0.9, s * 0.55);
  ctx.stroke();

  // Cabin
  ctx.beginPath();
  ctx.rect(cx + s * 0.2, cy - s * 0.6, s * 0.45, s * 0.85);
  ctx.stroke();

  // Chimney
  ctx.beginPath();
  ctx.rect(cx - s * 0.45, cy - s * 0.55, s * 0.2, s * 0.25);
  ctx.stroke();

  // Smoke
  ctx.beginPath();
  ctx.arc(cx - s * 0.35, cy - s * 0.7, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - s * 0.5, cy - s * 0.85, s * 0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Wheels
  ctx.beginPath();
  ctx.arc(cx - s * 0.45, cy + s * 0.25, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - s * 0.1, cy + s * 0.25, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.4, cy + s * 0.25, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  // Rail
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.9, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.9, cy + s * 0.4);
  ctx.stroke();

  // Window
  ctx.beginPath();
  ctx.rect(cx + s * 0.28, cy - s * 0.5, s * 0.28, s * 0.25);
  ctx.stroke();
}

function drawFlower(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.3;
  const cx = size / 2;
  const cy = size / 2 - s * 0.2;

  // Petals
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * s * 0.4;
    const py = cy + Math.sin(angle) * s * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, s * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Stem
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.lineTo(cx, cy + s * 1.4);
  ctx.stroke();

  // Leaf
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.quadraticCurveTo(cx + s * 0.35, cy + s * 0.7, cx + s * 0.4, cy + s * 0.95);
  ctx.quadraticCurveTo(cx + s * 0.25, cy + s * 1.0, cx, cy + s * 0.9);
  ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Trunk
  ctx.beginPath();
  ctx.rect(cx - s * 0.12, cy + s * 0.1, s * 0.24, s * 0.6);
  ctx.stroke();

  // Crown
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.2, s * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Inner crown details
  ctx.beginPath();
  ctx.arc(cx - s * 0.25, cy - s * 0.05, s * 0.3, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.25, cy - s * 0.05, s * 0.3, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Ground
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.stroke();
}

function drawSun(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.3;
  const cx = size / 2;
  const cy = size / 2;

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Rays
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const inner = s * 0.6;
    const outer = s * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  // Face
  ctx.beginPath();
  ctx.arc(cx - s * 0.15, cy - s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.15, cy - s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.05, s * 0.15, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawRainbow(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2 + s * 0.3;

  // Rainbow arcs
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const r = s * 0.9 - i * s * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
  }

  // Clouds
  ctx.beginPath();
  ctx.arc(cx - s * 0.8, cy, s * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - s * 0.65, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + s * 0.8, cy, s * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.65, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const points = 5;
  const outer = s * 0.75;
  const inner = s * 0.3;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Face
  ctx.beginPath();
  ctx.arc(cx - s * 0.1, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.1, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.05, s * 0.1, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.35;

  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.2, cx - s * 0.5, cy - s * 1.2, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 1.2, cx + s * 1.5, cy - s * 0.2, cx, cy + s * 0.7);
  ctx.stroke();
}

function drawHouse(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Walls
  ctx.beginPath();
  ctx.rect(cx - s * 0.55, cy - s * 0.1, s * 1.1, s * 0.75);
  ctx.stroke();

  // Roof
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.7, cy - s * 0.1);
  ctx.lineTo(cx, cy - s * 0.7);
  ctx.lineTo(cx + s * 0.7, cy - s * 0.1);
  ctx.closePath();
  ctx.stroke();

  // Door
  ctx.beginPath();
  ctx.rect(cx - s * 0.12, cy + s * 0.2, s * 0.24, s * 0.45);
  ctx.stroke();

  // Door knob
  ctx.beginPath();
  ctx.arc(cx + s * 0.06, cy + s * 0.42, s * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Left window
  ctx.beginPath();
  ctx.rect(cx - s * 0.45, cy + s * 0.05, s * 0.2, s * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.25);
  ctx.moveTo(cx - s * 0.45, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.15);
  ctx.stroke();

  // Right window
  ctx.beginPath();
  ctx.rect(cx + s * 0.25, cy + s * 0.05, s * 0.2, s * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.25);
  ctx.moveTo(cx + s * 0.25, cy + s * 0.15);
  ctx.lineTo(cx + s * 0.45, cy + s * 0.15);
  ctx.stroke();

  // Chimney
  ctx.beginPath();
  ctx.rect(cx + s * 0.3, cy - s * 0.6, s * 0.15, s * 0.3);
  ctx.stroke();
}

function drawCake(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Bottom tier
  ctx.beginPath();
  ctx.rect(cx - s * 0.6, cy + s * 0.05, s * 1.2, s * 0.45);
  ctx.stroke();

  // Top tier
  ctx.beginPath();
  ctx.rect(cx - s * 0.4, cy - s * 0.3, s * 0.8, s * 0.35);
  ctx.stroke();

  // Icing on bottom tier
  ctx.beginPath();
  for (let x = -0.6; x <= 0.55; x += 0.25) {
    ctx.moveTo(cx + x * s, cy + s * 0.05);
    ctx.quadraticCurveTo(cx + (x + 0.125) * s, cy + s * 0.2, cx + (x + 0.25) * s, cy + s * 0.05);
  }
  ctx.stroke();

  // Candles
  const candlePositions = [-0.2, 0, 0.2];
  candlePositions.forEach(pos => {
    ctx.beginPath();
    ctx.rect(cx + pos * s - s * 0.03, cy - s * 0.55, s * 0.06, s * 0.25);
    ctx.stroke();
    // Flame
    ctx.beginPath();
    ctx.moveTo(cx + pos * s, cy - s * 0.55);
    ctx.quadraticCurveTo(cx + pos * s - s * 0.04, cy - s * 0.68, cx + pos * s, cy - s * 0.72);
    ctx.quadraticCurveTo(cx + pos * s + s * 0.04, cy - s * 0.68, cx + pos * s, cy - s * 0.55);
    ctx.stroke();
  });

  // Plate
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.5, s * 0.75, s * 0.1, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIcecream(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  // Cone
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx, cy + s * 0.85);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.05);
  ctx.closePath();
  ctx.stroke();

  // Cone cross-hatch
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.25, cy + s * 0.2);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.55);
  ctx.moveTo(cx + s * 0.25, cy + s * 0.2);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.55);
  ctx.stroke();

  // Bottom scoop
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.1, s * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Top scoop
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.5, s * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Cherry
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.8, s * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.88);
  ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 1.0, cx + s * 0.05, cy - s * 0.95);
  ctx.stroke();
}

function drawCrown(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  // Crown body
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.6, cy + s * 0.3);
  ctx.lineTo(cx - s * 0.6, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.1, cy - s * 0.35);
  ctx.lineTo(cx, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.35);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.6, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.3);
  ctx.closePath();
  ctx.stroke();

  // Jewels
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.1, s * 0.06, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy + s * 0.15, s * 0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.3, cy + s * 0.15, s * 0.05, 0, Math.PI * 2);
  ctx.stroke();

  // Band at bottom
  ctx.beginPath();
  ctx.rect(cx - s * 0.6, cy + s * 0.2, s * 1.2, s * 0.1);
  ctx.stroke();
}

export { SKETCH_CATEGORIES };

export const SKETCHES: SketchData[] = [
  // Animals (7)
  { id: 'sketch-dog', name: '강아지', emoji: '🐶', category: 'animals', draw: drawDog },
  { id: 'sketch-cat', name: '고양이', emoji: '🐱', category: 'animals', draw: drawCat },
  { id: 'sketch-rabbit', name: '토끼', emoji: '🐰', category: 'animals', draw: drawRabbit },
  { id: 'sketch-bear', name: '곰', emoji: '🐻', category: 'animals', draw: drawBear },
  { id: 'sketch-fish', name: '물고기', emoji: '🐟', category: 'animals', draw: drawFish },
  { id: 'sketch-bird', name: '새', emoji: '🐦', category: 'animals', draw: drawBird },
  { id: 'sketch-butterfly', name: '나비', emoji: '🦋', category: 'animals', draw: drawButterfly },

  // Vehicles (5)
  { id: 'sketch-car', name: '자동차', emoji: '🚗', category: 'vehicles', draw: drawCar },
  { id: 'sketch-airplane', name: '비행기', emoji: '✈️', category: 'vehicles', draw: drawAirplane },
  { id: 'sketch-boat', name: '배', emoji: '⛵', category: 'vehicles', draw: drawBoat },
  { id: 'sketch-rocket', name: '로켓', emoji: '🚀', category: 'vehicles', draw: drawRocket },
  { id: 'sketch-train', name: '기차', emoji: '🚂', category: 'vehicles', draw: drawTrain },

  // Nature (5)
  { id: 'sketch-flower', name: '꽃', emoji: '🌸', category: 'nature', draw: drawFlower },
  { id: 'sketch-tree', name: '나무', emoji: '🌳', category: 'nature', draw: drawTree },
  { id: 'sketch-sun', name: '태양', emoji: '☀️', category: 'nature', draw: drawSun },
  { id: 'sketch-rainbow', name: '무지개', emoji: '🌈', category: 'nature', draw: drawRainbow },
  { id: 'sketch-star', name: '별', emoji: '⭐', category: 'nature', draw: drawStar },

  // Objects (3)
  { id: 'sketch-heart', name: '하트', emoji: '❤️', category: 'objects', draw: drawHeart },
  { id: 'sketch-house', name: '집', emoji: '🏠', category: 'objects', draw: drawHouse },
  { id: 'sketch-cake', name: '케이크', emoji: '🎂', category: 'objects', draw: drawCake },
  { id: 'sketch-icecream', name: '아이스크림', emoji: '🍦', category: 'objects', draw: drawIcecream },
  { id: 'sketch-crown', name: '왕관', emoji: '👑', category: 'objects', draw: drawCrown },
];
