import { localDate } from '@/lib/local-date';
import { getGameConfig } from '@/data/game-configs';
import { NUMBERS_DATA, HANGUL_DATA, ENGLISH_DATA, SHAPES_DATA } from '@/data';
import type { LearningCategory, ProgressItem } from '@/types/learning';
import type { GameRecord, GameId } from '@/types/game';

export interface ReviewItem {
  id: string;
  character: string;
  category: LearningCategory;
  label: string;
  /** Whole days since the child last traced it. */
  daysAgo: number;
}

export interface ReviewGame {
  id: GameId;
  name: string;
  stars: number;
}

export interface ReviewPlan {
  items: ReviewItem[];
  game: ReviewGame | null;
}

const DAY = 24 * 60 * 60 * 1000;
/** Only things the child has met before, and not again on the same day: review is for yesterday's learning. */
const MIN_DAYS = 1;
const MAX_DAYS = 14;
const MAX_ITEMS = 4;

function lookupLabel(item: ProgressItem): string | null {
  switch (item.category) {
    case 'numbers': return NUMBERS_DATA.find((n) => n.id === item.id)?.koreanName ?? null;
    case 'hangul': return HANGUL_DATA.find((h) => h.id === item.id)?.representativeWord ?? null;
    case 'english': return ENGLISH_DATA.find((e) => e.id === item.id)?.word ?? null;
    case 'shapes': return SHAPES_DATA.find((s) => s.id === item.id)?.name ?? null;
  }
}

/**
 * A light spaced-repetition pass over what the child has already practised:
 * things traced 1–14 days ago come back, the oldest and shakiest first, plus
 * one game that did not get three stars last time.
 */
export function buildReviewPlan(progress: Record<string, ProgressItem>, records: GameRecord[], now = new Date()): ReviewPlan {
  const today = localDate(now);
  const items = Object.values(progress)
    .filter((item) => item.lastPracticedAt && item.attempts > 0 && localDate(new Date(item.lastPracticedAt)) !== today)
    .map((item) => ({ item, daysAgo: Math.floor((now.getTime() - new Date(item.lastPracticedAt!).getTime()) / DAY) }))
    .filter(({ daysAgo }) => daysAgo >= MIN_DAYS && daysAgo <= MAX_DAYS)
    // Not yet completed first, then the weakest, then the longest ago.
    .sort((a, b) => Number(a.item.completed) - Number(b.item.completed) || a.item.bestScore - b.item.bestScore || b.daysAgo - a.daysAgo)
    .flatMap(({ item, daysAgo }) => {
      const label = lookupLabel(item);
      return label ? [{ id: item.id, character: item.character, category: item.category, label, daysAgo }] : [];
    })
    .slice(0, MAX_ITEMS);

  const latestByGame = new Map<GameId, GameRecord>();
  for (const record of records) {
    const previous = latestByGame.get(record.gameId);
    if (!previous || previous.completedAt < record.completedAt) latestByGame.set(record.gameId, record);
  }
  const retry = [...latestByGame.values()]
    .filter((record) => record.stars < 3 && localDate(new Date(record.completedAt)) !== today && getGameConfig(record.gameId))
    .sort((a, b) => a.stars - b.stars || a.completedAt.localeCompare(b.completedAt))[0];
  const game = retry ? { id: retry.gameId, name: getGameConfig(retry.gameId)!.name, stars: retry.stars } : null;

  return { items, game };
}
