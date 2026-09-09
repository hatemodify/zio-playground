import { STICKERS } from '@/data/stickers';
import { GAME_CONFIGS } from '@/data/game-configs';
import { HANGUL_CONSONANTS, HANGUL_VOWELS } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { CATEGORY_TOTALS, type ProgressItem } from '@/types/learning';
import type { GameRecord } from '@/types/game';

interface RewardFacts {
  totalStars: number;
  level: number;
  streak: number;
  gameRecords: GameRecord[];
  stickers: string[];
}

export function earnedMilestones(facts: RewardFacts, items: Record<string, ProgressItem>): string[] {
  const completed = Object.values(items).filter((item) => item.completed);
  const games = new Set(facts.gameRecords.map((record) => record.gameId));
  const allDone = (ids: string[]) => ids.every((id) => items[id]?.completed);
  return STICKERS.filter((sticker) => {
    if (facts.stickers.includes(sticker.id)) return false;
    const condition = sticker.unlockCondition;
    if (condition === 'first-game-clear') return games.size > 0;
    if (condition === 'all-games-played') return GAME_CONFIGS.every((game) => games.has(game.id));
    const numeric = /^(stars|level|streak|games)-(\d+)(?:-clear)?$/.exec(condition);
    if (numeric) {
      const values = { stars: facts.totalStars, level: facts.level, streak: facts.streak, games: games.size };
      return values[numeric[1] as keyof typeof values] >= Number(numeric[2]);
    }
    const all = /^(numbers|hangul|english)-all-complete$/.exec(condition);
    if (all) {
      const category = all[1] as keyof typeof CATEGORY_TOTALS;
      return completed.filter((item) => item.category === category).length >= CATEGORY_TOTALS[category];
    }
    if (condition === 'hangul-consonants-complete') return allDone(HANGUL_CONSONANTS.map((item) => item.id));
    if (condition === 'hangul-vowels-complete') return allDone(HANGUL_VOWELS.map((item) => item.id));
    if (condition === 'hangul-vowels-5-complete') return HANGUL_VOWELS.filter((item) => items[item.id]?.completed).length >= 5;
    const learning = /^(numbers|hangul|english)-(\d+)-complete$/.exec(condition);
    if (!learning) return false;
    const count = Number(learning[2]);
    if (learning[1] === 'numbers') return items[`number-${count}`]?.completed === true;
    if (learning[1] === 'english') return allDone(ENGLISH_DATA.slice(0, count).map((item) => item.id));
    return HANGUL_CONSONANTS.filter((item) => items[item.id]?.completed).length >= count;
  }).map((sticker) => sticker.id);
}
