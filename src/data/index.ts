export {
  NUMBERS_DATA,
  NUMBERS_MAX,
  getNumberById,
  getNumberByValue,
  toNativeKoreanName,
  toEnglishName,
} from './numbers';
export type { NumberItem } from './numbers';

export { HANGUL_DATA, HANGUL_CONSONANTS, HANGUL_VOWELS, getHangulById, getHangulByCharacter } from './hangul';
export type { HangulItem, HangulType } from './hangul';

export { ENGLISH_DATA, getEnglishById, getEnglishByCharacter } from './english';
export type { EnglishItem } from './english';

export { GAME_CONFIGS, getGameConfig, getAvailableGamesForCategory } from './game-configs';
export type { GameConfig, GameDifficultyConfig } from './game-configs';

export { STICKERS, getStickerById, getStickersByCategory } from './stickers';
export type { StickerInfo, StickerTheme } from './stickers';

export {
  NUMBER_STROKES,
  HANGUL_CONSONANT_STROKES,
  HANGUL_VOWEL_STROKES,
  ENGLISH_UPPERCASE_STROKES,
  getStrokesForCharacter,
} from './stroke-paths';
export type { StrokePoint, CharacterStroke, StrokeData } from './stroke-paths';

export { SKETCHES, SKETCH_CATEGORIES } from './sketches';
export type { SketchData, SketchCategory } from './sketches';
