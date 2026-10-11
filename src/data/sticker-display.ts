import { pictureEnglishName, pictureName, type PictureId } from '@/data/picture-content';
import { getStickerById } from '@/data/stickers';
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { SHAPES_DATA } from '@/data/shapes';
import type { AppLanguage, StickerBookTheme } from '@/stores/settings-store';
import type { LearningCategory } from '@/types/learning';

// The sticker book and the acquisition dialogs must resolve an ID to the same artwork.
export interface CharacterSticker {
  id: string;
  name: string;
  category: LearningCategory;
  character: string;
  picture: PictureId;
}

export interface StickerDisplay {
  id: string;
  name: string;
  picture: PictureId;
}

const BOY_CATEGORY_PICTURES: Record<LearningCategory, PictureId[]> = {
  numbers: ['car', 'suv', 'race-car', 'police-car', 'taxi', 'ambulance', 'fire-truck', 'pickup', 'truck', 'bus'],
  hangul: ['excavator', 'crane', 'dump-truck', 'bulldozer', 'cement-mixer', 'forklift', 'tractor', 'roller'],
  english: ['airplane', 'helicopter', 'light-plane', 'rocket', 'ufo', 'hot-air-balloon', 'hang-glider', 'shuttle'],
  shapes: ['kite', 'gem', 'soccer-ball', 'dice', 'red-heart', 'glowing-star', 'egg', 'tent'],
};
const GIRL_CATEGORY_PICTURES: Record<LearningCategory, PictureId[]> = {
  numbers: ['rabbit', 'cat', 'dog', 'panda', 'fox', 'koala', 'squirrel', 'unicorn', 'butterfly', 'giraffe'],
  hangul: ['pig', 'cow', 'elephant', 'duck', 'penguin', 'whale', 'owl', 'horse', 'turtle', 'lion'],
  english: ['butterfly', 'unicorn', 'fox', 'rabbit', 'cat', 'dog', 'panda', 'koala', 'giraffe', 'elephant'],
  shapes: ['cherry-blossom', 'tulip', 'sunflower', 'rainbow', 'red-heart', 'heart-ribbon', 'ribbon', 'gem'],
};
export const BOY_MILESTONE_PICTURES: Record<string, PictureId> = {
  'sticker-num-puppy': 'police-car',
  'sticker-num-kitten': 'fire-truck',
  'sticker-num-bunny': 'ambulance',
  'sticker-num-panda': 'race-car',
  'sticker-num-lion': 'suv',
  'sticker-num-trophy': 'trophy',
  'sticker-han-cake': 'excavator',
  'sticker-han-cookie': 'crane',
  'sticker-han-donut': 'dump-truck',
  'sticker-han-icecream': 'bulldozer',
  'sticker-han-candy': 'cement-mixer',
  'sticker-han-trophy': 'trophy',
  'sticker-eng-car': 'airplane',
  'sticker-eng-bus': 'helicopter',
  'sticker-eng-train': 'light-plane',
  'sticker-eng-airplane': 'rocket',
  'sticker-eng-rocket': 'ufo',
  'sticker-eng-trophy': 'trophy',
  'sticker-special-streak3': 'train',
  'sticker-special-streak7': 'high-speed-train',
  'sticker-special-firstgame': 'boat',
  'sticker-special-allgames': 'cruise-ship',
  'sticker-space-rocket': 'submarine',
  'sticker-space-astronaut': 'speedboat',
  'sticker-space-ufo': 'hovercraft',
  'sticker-ocean-whale': 'monorail',
  'sticker-ocean-dolphin': 'cable-car',
  'sticker-ocean-octopus': 'tram',
  'sticker-dino-trex': 'motorcycle',
  'sticker-dino-tricera': 'scooter',
  'sticker-insect-butterfly': 'hot-air-balloon',
  'sticker-insect-ladybug': 'hang-glider',
  'sticker-music-guitar': 'submersible',
  'sticker-music-drum': 'zipline',
  'sticker-music-piano': 'snowmobile',
  'sticker-sports-soccer': 'fighter',
  'sticker-sports-medal': 'shuttle',
};
export const GIRL_MILESTONE_PICTURES: Record<string, PictureId> = {
  'sticker-num-puppy': 'dog', 'sticker-num-kitten': 'cat', 'sticker-num-bunny': 'rabbit',
  'sticker-num-panda': 'panda', 'sticker-num-lion': 'lion', 'sticker-num-trophy': 'unicorn',
  'sticker-han-cake': 'fox', 'sticker-han-cookie': 'squirrel', 'sticker-han-donut': 'koala',
  'sticker-han-icecream': 'butterfly', 'sticker-han-candy': 'turtle', 'sticker-han-trophy': 'rainbow',
  'sticker-eng-car': 'giraffe', 'sticker-eng-bus': 'elephant', 'sticker-eng-train': 'pig',
  'sticker-eng-airplane': 'cow', 'sticker-eng-rocket': 'whale', 'sticker-eng-trophy': 'cherry-blossom',
  'sticker-special-streak3': 'tulip', 'sticker-special-streak7': 'sunflower',
  'sticker-special-firstgame': 'duck', 'sticker-special-allgames': 'horse',
  'sticker-space-rocket': 'owl', 'sticker-space-astronaut': 'penguin', 'sticker-space-ufo': 'ribbon',
  'sticker-ocean-whale': 'shell', 'sticker-ocean-dolphin': 'jellyfish', 'sticker-ocean-octopus': 'octopus',
  'sticker-dino-trex': 'tiger', 'sticker-dino-tricera': 'raccoon',
  'sticker-insect-butterfly': 'butterfly', 'sticker-insect-ladybug': 'cherry-blossom',
  'sticker-music-guitar': 'red-heart', 'sticker-music-drum': 'heart-ribbon', 'sticker-music-piano': 'gem',
  'sticker-sports-soccer': 'unicorn', 'sticker-sports-medal': 'glowing-star',
};

export function getCharacterStickers(theme: StickerBookTheme): CharacterSticker[] {
  const stickers: CharacterSticker[] = [];
  const categoryPictures = theme === 'girl' ? GIRL_CATEGORY_PICTURES : BOY_CATEGORY_PICTURES;

  NUMBERS_DATA.forEach((n, i) => {
    stickers.push({
      id: `sticker-learn-${n.id}`,
      name: `숫자 ${n.character}`,
      category: 'numbers',
      character: n.character,
      picture: categoryPictures.numbers[i % categoryPictures.numbers.length],
    });
  });

  HANGUL_DATA.forEach((h, i) => {
    stickers.push({
      id: `sticker-learn-${h.id}`,
      name: h.character,
      category: 'hangul',
      character: h.character,
      picture: categoryPictures.hangul[i % categoryPictures.hangul.length],
    });
  });

  ENGLISH_DATA.forEach((e, i) => {
    stickers.push({
      id: `sticker-learn-${e.id}`,
      name: e.uppercase,
      category: 'english',
      character: e.uppercase,
      picture: categoryPictures.english[i % categoryPictures.english.length],
    });
  });

  SHAPES_DATA.forEach((s, i) => {
    stickers.push({
      id: `sticker-learn-${s.id}`,
      name: s.name,
      category: 'shapes',
      character: s.character,
      picture: categoryPictures.shapes[i % categoryPictures.shapes.length],
    });
  });

  return stickers;
}

export function getStickerDisplay(id: string, theme: StickerBookTheme, language: AppLanguage): StickerDisplay | undefined {
  if (id.startsWith('sticker-learn-')) {
    const character = getCharacterStickers(theme).find((sticker) => sticker.id === id);
    return character && { id, name: character.name, picture: character.picture };
  }

  const milestone = getStickerById(id);
  if (!milestone) return undefined;
  const picture = (theme === 'girl' ? GIRL_MILESTONE_PICTURES : BOY_MILESTONE_PICTURES)[id] ?? 'star';
  const name = theme === 'girl'
    ? language === 'en' ? pictureEnglishName(picture) : pictureName(picture)
    : milestone.name;
  return { id, name, picture };
}
