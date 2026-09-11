import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { getStickerById } from '@/data/stickers';
import CharacterDdori from './CharacterDdori';

type CelebrationType = 'stage_complete' | 'tracing_complete' | 'game_complete' | 'level_up';

interface RewardCelebrationProps {
  type: CelebrationType;
  stars?: number;
  level?: number;
  message?: string;
  open: boolean;
  onDismiss: () => void;
  autoDismissMs?: number;
  newStickers?: string[];
}

const celebrationConfig: Record<CelebrationType, {
  title: string;
  expression: 'happy' | 'excited' | 'celebrating';
  defaultMessage: string;
  starCount: number;
}> = {
  stage_complete: {
    title: '잘했어요!',
    expression: 'happy',
    defaultMessage: '한 단계를 완료했어요!',
    starCount: 1,
  },
  tracing_complete: {
    title: '대단해요!',
    expression: 'celebrating',
    defaultMessage: '따라쓰기를 모두 완료했어요!',
    starCount: 3,
  },
  game_complete: {
    title: '게임 클리어!',
    expression: 'excited',
    defaultMessage: '게임을 완료했어요!',
    starCount: 0,
  },
  level_up: {
    title: '레벨 업!',
    expression: 'celebrating',
    defaultMessage: '새로운 레벨에 도달했어요!',
    starCount: 0,
  },
};

function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#FFD93D', '#FF6B81', '#4A90D9', '#2ED573', '#A29BFE', '#FF9FF3'];
  return <motion.div className="absolute rounded-sm" style={{ width: 8 + index % 7, height: 8 + index % 4, backgroundColor: colors[index % colors.length], left: `${(index * 37) % 100}%`, top: '-5%', borderRadius: index % 3 === 0 ? '50%' : 2 }}
    initial={{ y: '-5vh', rotate: 0, opacity: 0 }}
    animate={{ x: [0, (index % 2 ? 1 : -1) * 60, 0], y: '110vh', rotate: index * 43, opacity: [0, 1, 1, 0] }}
    transition={{ duration: 2.8 + (index % 4) * 0.3, delay: (index % 12) * 0.06, ease: 'easeOut' }} />;
}

export default function RewardCelebration({
  type,
  stars,
  level,
  message,
  open,
  onDismiss,
  autoDismissMs = 4500,
  newStickers,
}: RewardCelebrationProps) {
  const reducedMotion = useReducedMotion();
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    continueRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [open]);

  const config = celebrationConfig[type];
  const displayStars = stars ?? config.starCount;
  const displayMessage = message ?? config.defaultMessage;

  const handleAutoDismiss = useCallback(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  useEffect(() => {
    if (!open) return;
    return handleAutoDismiss();
  }, [open, handleAutoDismiss]);

  return (
    <MotionConfig reducedMotion="user"><AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-label={config.title}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onDismiss();
            if (event.key === 'Tab') { event.preventDefault(); continueRef.current?.focus(); }
          }}
          onClick={onDismiss}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-md" />

          {/* Confetti */}
          {!reducedMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 72 }, (_, i) => i).map((i) => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </div>
          )}

          {!reducedMotion && <div className="celebration-rays" aria-hidden="true" />}
          {/* Content */}
          <motion.div
            className="relative z-10 flex max-h-[90dvh] flex-col items-center gap-4 overflow-y-auto rounded-[36px] border border-white/20 bg-white/10 px-7 py-6 shadow-2xl"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="rounded-full bg-amber-300 px-4 py-1 text-xs font-extrabold tracking-widest text-amber-950">YOU DID IT!</span>
            {/* Character */}
            <CharacterDdori
              expression={config.expression}
              size="lg"
              animated
            />

            {/* Title */}
            <motion.h2
              className={cn(
                'font-display text-3xl font-extrabold text-white',
                'drop-shadow-lg',
              )}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {type === 'level_up' && level ? `레벨 ${level}!` : config.title}
            </motion.h2>

            {/* Stars */}
            {displayStars > 0 && (
              <div className="flex gap-2">
                {Array.from({ length: displayStars }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.15,
                      type: 'spring',
                      stiffness: 400,
                      damping: 12,
                    }}
                  >
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path
                        d="M20 2L24.5 13.5L37 15L27.5 23.5L30 36L20 30L10 36L12.5 23.5L3 15L15.5 13.5L20 2Z"
                        fill="#FFD93D"
                        stroke="#E6C235"
                        strokeWidth="1"
                      />
                    </svg>
                  </motion.div>
                ))}
              </div>
            )}

            {/* New stickers earned */}
            {newStickers && newStickers.length > 0 && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-sm font-bold text-accent-yellow drop-shadow">
                  새 스티커 획득!
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {newStickers.map((id, i) => {
                    const info = getStickerById(id);
                    return (
                      <motion.div
                        key={id}
                        className="flex flex-col items-center gap-1 rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.7 + i * 0.15,
                          type: 'spring',
                          stiffness: 400,
                          damping: 12,
                        }}
                      >
                        <span className="text-2xl">🏆</span>
                        <span className="max-w-[80px] truncate text-xs font-semibold text-white">
                          {info?.name ?? '스티커'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Message */}
            <motion.p
              className="text-center text-lg font-semibold text-white/90 drop-shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {displayMessage}
            </motion.p>

            {/* Tap to continue */}
            <button ref={continueRef} className="mt-2 min-h-12 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-teal-800 shadow-lg" onClick={(event) => { event.stopPropagation(); onDismiss(); }}>
              탭하여 계속하기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></MotionConfig>
  );
}
