export interface RewardState {
  totalStars: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  stickers: string[];
  unlockedGames: string[];
  characterOutfits: string[];
}

export interface LevelInfo {
  level: number;
  name: string;
  requiredStars: number;
  badge: string;
}

export const LEVEL_TABLE: LevelInfo[] = [
  { level: 1,  name: '새싹',     requiredStars: 0,   badge: '🌱' },
  { level: 2,  name: '씨앗',     requiredStars: 10,  badge: '🫘' },
  { level: 3,  name: '새잎',     requiredStars: 30,  badge: '🌿' },
  { level: 4,  name: '꽃봉오리', requiredStars: 60,  badge: '🌷' },
  { level: 5,  name: '꽃',       requiredStars: 100, badge: '🌸' },
  { level: 6,  name: '나비',     requiredStars: 150, badge: '🦋' },
  { level: 7,  name: '무지개',   requiredStars: 210, badge: '🌈' },
  { level: 8,  name: '별',       requiredStars: 280, badge: '⭐' },
  { level: 9,  name: '달',       requiredStars: 360, badge: '🌙' },
  { level: 10, name: '태양',     requiredStars: 450, badge: '☀️' },
] as const;

export function getLevelForStars(stars: number): LevelInfo {
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (stars >= LEVEL_TABLE[i].requiredStars) {
      return LEVEL_TABLE[i];
    }
  }
  return LEVEL_TABLE[0];
}

export function getNextLevel(currentLevel: number): LevelInfo | null {
  const idx = LEVEL_TABLE.findIndex((l) => l.level === currentLevel);
  if (idx < 0 || idx >= LEVEL_TABLE.length - 1) return null;
  return LEVEL_TABLE[idx + 1];
}
