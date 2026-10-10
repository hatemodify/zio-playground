import Picture from '@/components/games/Picture';
import { pictureName, pictureEnglishName, type PictureId } from '@/data/picture-content';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationStore } from '@/stores/gamification-store';
import { useProgressStore } from '@/stores/progress-store';
import { STICKERS, type StickerInfo } from '@/data/stickers';
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { SHAPES_DATA } from '@/data/shapes';
import { cn } from '@/lib/cn';
import { useSettingsStore, type StickerBookTheme } from '@/stores/settings-store';
import type { LearningCategory } from '@/types/learning';

type StickerTab = 'all' | 'numbers' | 'hangul' | 'english' | 'shapes' | 'special';

const TAB_LABELS: Record<StickerTab, string> = {
  all: '전체',
  numbers: '숫자',
  hangul: '한글',
  english: '영어',
  shapes: '도형',
  special: '특별',
};

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
const BOY_MILESTONE_PICTURES: Record<string, PictureId> = {
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
const GIRL_MILESTONE_PICTURES: Record<string, PictureId> = {
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

interface CharacterSticker {
  id: string;
  name: string;
  category: LearningCategory;
  character: string;
  picture: PictureId;
}

function getCharacterStickers(theme: StickerBookTheme): CharacterSticker[] {
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

export default function StickersPage() {
  const theme = useSettingsStore((s) => s.stickerBookTheme);
  const setTheme = useSettingsStore((s) => s.setStickerBookTheme);
  const language = useSettingsStore((s) => s.language);
  const { stickers: ownedStickers } = useGamificationStore();
  const { getItem } = useProgressStore();
  const [tab, setTab] = useState<StickerTab>('all');
  const [selectedSticker, setSelectedSticker] = useState<{ id: string; name: string; picture: PictureId; description: string; owned: boolean } | null>(null);

  const characterStickers = getCharacterStickers(theme);
  const milestonePictures = theme === 'girl' ? GIRL_MILESTONE_PICTURES : BOY_MILESTONE_PICTURES;
  const stickerName = (sticker: StickerInfo) => {
    if (theme === 'boy') return sticker.name;
    const picture = milestonePictures[sticker.id] ?? 'star';
    return language === 'en' ? pictureEnglishName(picture) : pictureName(picture);
  };

  // Filter milestone stickers by tab
  const filteredMilestoneStickers = STICKERS.filter((s) => {
    if (tab === 'all') return true;
    if (tab === 'special') return s.category === 'special';
    return s.category === tab;
  });

  // Filter character stickers by tab
  const filteredCharStickers = characterStickers.filter((s) => {
    if (tab === 'all') return true;
    if (tab === 'special') return false;
    return s.category === tab;
  });

  // Check if character sticker is owned (completed tracing stage 3)
  const isCharStickerOwned = useCallback((sticker: CharacterSticker) => {
    // Check if ID is in owned stickers
    if (ownedStickers.includes(sticker.id)) return true;
    // Also check if the learning item is completed
    const item = getItem(sticker.id.replace('sticker-learn-', ''));
    return item?.completed ?? false;
  }, [ownedStickers, getItem]);

  const totalOwned = filteredMilestoneStickers.filter((s) => ownedStickers.includes(s.id)).length +
    filteredCharStickers.filter((s) => isCharStickerOwned(s)).length;
  const totalStickers = filteredMilestoneStickers.length + filteredCharStickers.length;

  const handleMilestoneStickerClick = (sticker: StickerInfo) => {
    setSelectedSticker({
      id: sticker.id,
      name: stickerName(sticker),
      picture: milestonePictures[sticker.id] || 'star',
      description: sticker.description,
      owned: ownedStickers.includes(sticker.id),
    });
  };

  const handleCharStickerClick = useCallback((sticker: CharacterSticker, owned: boolean) => {
    setSelectedSticker({
      id: sticker.id,
      name: sticker.name,
      picture: sticker.picture,
      description: `${sticker.character} 학습 완료`,
      owned,
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">스티커북</h1>
        <span className="text-sm font-medium text-text-medium">
          {totalOwned} / {totalStickers} 수집
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-2 shadow-card">
        <span className="pl-2 text-sm font-bold text-text-medium">{language === 'en' ? 'Sticker theme' : '스티커 테마'}</span>
        <div className="flex gap-1" role="group" aria-label={language === 'en' ? 'Sticker theme' : '스티커 테마'}>
          {([['boy', '🚗', '남아용', 'Boys'], ['girl', '🦊', '여아용', 'Girls']] as const).map(([value, emoji, ko, en]) => (
            <button key={value} type="button" aria-pressed={theme === value} onClick={() => { setTheme(value); setSelectedSticker(null); }}
              className={cn('min-h-11 rounded-xl px-3 text-sm font-bold', theme === value ? 'bg-primary text-white' : 'bg-bg-warm text-text-medium')}>
              {emoji} {language === 'en' ? en : ko}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as StickerTab[]).map((t) => (
          <button
            key={t}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold transition-all touch-manipulation',
              tab === t ? 'bg-primary text-white shadow-button' : 'bg-primary/10 text-text-medium',
            )}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Milestone stickers section */}
      {filteredMilestoneStickers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-text-medium">마일스톤 스티커</h3>
          <div className="grid grid-cols-4 gap-2 landscape-tablet:grid-cols-6">
            {filteredMilestoneStickers.map((sticker) => {
              const owned = ownedStickers.includes(sticker.id);
              return (
                <motion.button
                  key={sticker.id}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2 transition-all touch-manipulation',
                    owned ? 'bg-white shadow-card' : 'bg-gray-100',
                  )}
                  onClick={() => handleMilestoneStickerClick(sticker)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={cn('w-full', !owned && 'grayscale opacity-30')}>
                    {<Picture id={milestonePictures[sticker.id] || 'star'} className="h-16 w-full" />}
                  </span>
                  <span className={cn(
                    'text-[10px] font-medium leading-tight text-center',
                    owned ? 'text-text-dark' : 'text-text-light',
                  )}>
                    {stickerName(sticker)}
                  </span>
                  {!owned && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="11" width="12" height="10" rx="2" fill="#B2BEC3" />
                      <path d="M9 11V8C9 6.34 10.34 5 12 5C13.66 5 15 6.34 15 8V11" stroke="#B2BEC3" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Character stickers section */}
      {filteredCharStickers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-text-medium">글자 스티커</h3>
          <div className="grid grid-cols-6 gap-2 landscape-tablet:grid-cols-6">
            {filteredCharStickers.map((sticker) => {
              const owned = isCharStickerOwned(sticker);
              return (
                <motion.button
                  key={sticker.id}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all touch-manipulation',
                    owned ? 'bg-white shadow-card' : 'bg-gray-50',
                  )}
                  onClick={() => handleCharStickerClick(sticker, owned)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={cn('w-full', !owned && 'grayscale opacity-20')}>
                    {<Picture id={sticker.picture} className="h-10 w-full" />}
                  </span>
                  <span data-i18n-ignore className={cn(
                    'text-[10px] font-bold',
                    owned ? 'text-text-dark' : 'text-text-light',
                  )}>
                    {sticker.character}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticker detail modal */}
      <AnimatePresence>
        {selectedSticker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSticker(null)}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
              className="relative z-10 flex flex-col items-center gap-3 rounded-3xl bg-white p-8 shadow-modal"
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className={cn('text-6xl', !selectedSticker.owned && 'grayscale opacity-30')}>
                {<Picture id={selectedSticker.picture} className="h-36 w-48" />}
              </span>
              <span data-i18n-ignore={selectedSticker.id.startsWith('sticker-learn-') ? true : undefined} className="text-xl font-bold text-text-dark">{selectedSticker.name}</span>
              <span className="text-sm text-text-medium">{selectedSticker.description}</span>
              {selectedSticker.owned ? (
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">획득 완료</span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-light">미획득</span>
              )}
              <button
                className="mt-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary touch-manipulation"
                onClick={() => setSelectedSticker(null)}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
