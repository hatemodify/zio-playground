import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationStore } from '@/stores/gamification-store';
import { useProgressStore } from '@/stores/progress-store';
import { STICKERS, type StickerInfo } from '@/data/stickers';
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

type StickerTab = 'all' | 'numbers' | 'hangul' | 'english' | 'special';

const TAB_LABELS: Record<StickerTab, string> = {
  all: '전체',
  numbers: '숫자',
  hangul: '한글',
  english: '영어',
  special: '특별',
};

// Emoji icons for character-based stickers — vehicles theme
const CATEGORY_EMOJI_MAP: Record<string, string[]> = {
  numbers: ['🚗', '🚙', '🏎️', '🚓', '🚕', '🚑', '🚒', '🛻', '🚐', '🚎'],
  hangul: [
    '🚜', '🏗️', '🚧', '🔧', '🪨', '🚛', '🔩', '⚙️', '🪝', '🛞',
    '🧱', '🪚', '🔨', '🛠️', '⛏️', '🪛', '🏭', '🛤️', '🚏', '🪜',
    '🏗️', '🚜', '🔧', '🪨',
  ],
  english: [
    '✈️', '🚁', '🛩️', '🚀', '🛸', '🎈', '🪂', '🛫', '🛬', '🌍',
    '🛰️', '⭐', '🌙', '☁️', '🌤️', '🌈', '💫', '🪁', '🎆', '🎇',
    '🌠', '🛫', '🛬', '🚁', '✈️', '🚀',
  ],
};

// Milestone sticker emoji — vehicles theme
const MILESTONE_EMOJI: Record<string, string> = {
  // Numbers — cars
  'sticker-num-puppy': '🚓',
  'sticker-num-kitten': '🚒',
  'sticker-num-bunny': '🚑',
  'sticker-num-panda': '🏎️',
  'sticker-num-lion': '🚙',
  'sticker-num-trophy': '🏆',
  // Hangul — construction
  'sticker-han-cake': '🚜',
  'sticker-han-cookie': '🏗️',
  'sticker-han-donut': '🚛',
  'sticker-han-icecream': '⚙️',
  'sticker-han-candy': '🔧',
  'sticker-han-trophy': '🏆',
  // English — aviation
  'sticker-eng-car': '✈️',
  'sticker-eng-bus': '🚁',
  'sticker-eng-train': '🛩️',
  'sticker-eng-airplane': '🚀',
  'sticker-eng-rocket': '🛸',
  'sticker-eng-trophy': '🏆',
  // Special — special vehicles
  'sticker-special-streak3': '🚂',
  'sticker-special-streak7': '🚃',
  'sticker-special-firstgame': '⛵',
  'sticker-special-allgames': '🛳️',
  // Water vehicles
  'sticker-space-rocket': '🛥️',
  'sticker-space-astronaut': '🚤',
  'sticker-space-ufo': '🛶',
  // Rail vehicles
  'sticker-ocean-whale': '🚝',
  'sticker-ocean-dolphin': '🚡',
  'sticker-ocean-octopus': '🚊',
  // Two-wheelers
  'sticker-dino-trex': '🏍️',
  'sticker-dino-tricera': '🛵',
  // Fun vehicles
  'sticker-insect-butterfly': '🎈',
  'sticker-insect-ladybug': '🪂',
  // Special purpose
  'sticker-music-guitar': '🚢',
  'sticker-music-drum': '🚠',
  'sticker-music-piano': '🛷',
  // Achievement
  'sticker-sports-soccer': '🛩️',
  'sticker-sports-medal': '🚀',
};

interface CharacterSticker {
  id: string;
  name: string;
  category: LearningCategory;
  character: string;
  emoji: string;
}

function getCharacterStickers(): CharacterSticker[] {
  const stickers: CharacterSticker[] = [];

  NUMBERS_DATA.forEach((n, i) => {
    stickers.push({
      id: `sticker-learn-${n.id}`,
      name: `숫자 ${n.character}`,
      category: 'numbers',
      character: n.character,
      emoji: CATEGORY_EMOJI_MAP.numbers[i % CATEGORY_EMOJI_MAP.numbers.length],
    });
  });

  HANGUL_DATA.forEach((h, i) => {
    stickers.push({
      id: `sticker-learn-${h.id}`,
      name: h.character,
      category: 'hangul',
      character: h.character,
      emoji: CATEGORY_EMOJI_MAP.hangul[i % CATEGORY_EMOJI_MAP.hangul.length],
    });
  });

  ENGLISH_DATA.forEach((e, i) => {
    stickers.push({
      id: `sticker-learn-${e.id}`,
      name: e.uppercase,
      category: 'english',
      character: e.uppercase,
      emoji: CATEGORY_EMOJI_MAP.english[i % CATEGORY_EMOJI_MAP.english.length],
    });
  });

  return stickers;
}

export default function StickersPage() {
  const { stickers: ownedStickers } = useGamificationStore();
  const { getItem } = useProgressStore();
  const [tab, setTab] = useState<StickerTab>('all');
  const [selectedSticker, setSelectedSticker] = useState<{ id: string; name: string; emoji: string; description: string; owned: boolean } | null>(null);

  const characterStickers = getCharacterStickers();

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

  const handleMilestoneStickerClick = useCallback((sticker: StickerInfo) => {
    setSelectedSticker({
      id: sticker.id,
      name: sticker.name,
      emoji: MILESTONE_EMOJI[sticker.id] || '⭐',
      description: sticker.description,
      owned: ownedStickers.includes(sticker.id),
    });
  }, [ownedStickers]);

  const handleCharStickerClick = useCallback((sticker: CharacterSticker, owned: boolean) => {
    setSelectedSticker({
      id: sticker.id,
      name: sticker.name,
      emoji: sticker.emoji,
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
                  <span className={cn('text-3xl', !owned && 'grayscale opacity-30')}>
                    {MILESTONE_EMOJI[sticker.id] || '⭐'}
                  </span>
                  <span className={cn(
                    'text-[10px] font-medium leading-tight text-center',
                    owned ? 'text-text-dark' : 'text-text-light',
                  )}>
                    {sticker.name}
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
                  <span className={cn('text-2xl', !owned && 'grayscale opacity-20')}>
                    {sticker.emoji}
                  </span>
                  <span className={cn(
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
                {selectedSticker.emoji}
              </span>
              <span className="text-xl font-bold text-text-dark">{selectedSticker.name}</span>
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
