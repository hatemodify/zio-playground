import Picture from '@/components/games/Picture';
import type { PictureId } from '@/data/picture-content';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationStore } from '@/stores/gamification-store';
import { useProgressStore } from '@/stores/progress-store';
import { STICKERS, type StickerInfo } from '@/data/stickers';
import { getCharacterStickers, getStickerDisplay, BOY_MILESTONE_PICTURES, GIRL_MILESTONE_PICTURES, type CharacterSticker } from '@/data/sticker-display';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/cn';

type StickerTab = 'all' | 'numbers' | 'hangul' | 'english' | 'shapes' | 'special';

const TAB_LABELS: Record<StickerTab, string> = {
  all: '전체',
  numbers: '숫자',
  hangul: '한글',
  english: '영어',
  shapes: '도형',
  special: '특별',
};

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
  const stickerName = (sticker: StickerInfo) => getStickerDisplay(sticker.id, theme, language)?.name ?? sticker.name;

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
