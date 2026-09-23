import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WritingCanvas from './WritingCanvas';
import Ddori from '@/assets/characters/Ddori';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useProgressStore } from '@/stores/progress-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSound } from '@/hooks/use-sound';
import { useLandscapeTablet } from '@/hooks/use-media-query';
import { useElementSize } from '@/hooks/use-element-size';
import type { LearningCategory } from '@/types/learning';

/** Padding of the white card the canvas sits in (p-3 on both sides). */
const CARD_PADDING = 24;
/** Never shrink past this, even on the narrowest phone. */
const MIN_CANVAS = 240;
/** A square much wider than this stops being comfortable to trace on. */
const MAX_CANVAS = 560;

/**
 * Viewport height, tracked so a square canvas sized purely from the available
 * width can't grow taller than the screen (a phone held in landscape).
 */
function useViewportHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerHeight,
  );
  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return height;
}

interface LearningScreenProps {
  id: string;
  character: string;
  category: LearningCategory;
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
}

export default function LearningScreen({
  id,
  character,
  category,
  topContent,
  bottomContent,
  onNext,
  onPrev,
  className,
}: LearningScreenProps) {
  const { completeTracingStage, getItem, initializeItem } = useProgressStore();
  const { addStars, addSticker, checkAndGrantStickers } = useGamificationStore();
  const { play } = useSound();
  const isLandscape = useLandscapeTablet();

  // The tracing sheet takes whatever width the writing column leaves it, capped
  // so the square still fits on screen without scrolling.
  const { ref: writingColumnRef, size: writingColumn } = useElementSize<HTMLDivElement>();
  const viewportHeight = useViewportHeight();
  const widthLimit = writingColumn.width > 0 ? writingColumn.width - CARD_PADDING : MAX_CANVAS;
  const heightLimit = Math.max(MIN_CANVAS, Math.round(viewportHeight * 0.62));
  const canvasSize = Math.round(
    Math.max(MIN_CANVAS, Math.min(widthLimit, heightLimit, MAX_CANVAS)),
  );

  useEffect(() => {
    initializeItem({ id, category, character, tracingStage: 0, completed: false,
      attempts: 0, bestScore: 0, lastPracticedAt: null });
  }, [id, category, character, initializeItem]);
  const completedId = useRef<string | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); }, []);

  const [showCelebration, setShowCelebration] = useState(false);
  const [writingDone, setWritingDone] = useState(false);
  const [rewardStars, setRewardStars] = useState(0);

  // Single-step writing completion
  const handleWritingComplete = useCallback(() => {
    if (completedId.current === id) return;
    completedId.current = id;
    setWritingDone(true);

    play('stroke_complete');

    // Complete all tracing stages at once
    const firstCompletion = !getItem(id)?.completed;
    completeTracingStage(id, 3);

    // Award stars and sticker
    setRewardStars(firstCompletion ? 3 : 0);
    if (firstCompletion) addStars(3);
    const stickerId = `sticker-learn-${id}`;
    addSticker(stickerId);
    checkAndGrantStickers();
    play('confetti');

    setShowCelebration(true);
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    celebrationTimer.current = setTimeout(() => setShowCelebration(false), 3000);
  }, [id, getItem, completeTracingStage, addStars, addSticker, checkAndGrantStickers, play]);

  // Reset writingDone when character changes
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setWritingDone(false);
    setShowCelebration(false);
  }

  return (
    <div className={cn('flex items-start gap-4 px-4 pb-6', isLandscape ? 'flex-row' : 'flex-col items-center', className)}>
      {/* Left panel: content */}
      <div className={cn('flex flex-col items-center gap-4', isLandscape ? 'w-1/2 sticky top-14' : 'w-full')}>
        {/* Top content (big character, object image, etc.) */}
        {topContent && <div className="w-full">{topContent}</div>}

        {/* Bottom content (word card, counting, etc.) */}
        {bottomContent && <div className="w-full">{bottomContent}</div>}
      </div>

      {/* Right panel: canvas + navigation */}
      <div ref={writingColumnRef} className={cn('flex flex-col items-center gap-4', isLandscape ? 'w-1/2' : 'w-full')}>
        {/* Writing label */}
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">
            따라 쓰기
          </div>
          {writingDone && (
            <div className="flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-sm font-medium text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              완료!
            </div>
          )}
        </div>

        {/* Writing canvas */}
        <div className="rounded-3xl bg-white p-3 pb-16 shadow-card">
          <WritingCanvas
            character={character}
            canvasSize={canvasSize}
            onComplete={handleWritingComplete}
          />
        </div>

        {/* Navigation */}
        <div className="flex w-full max-w-xs items-center justify-between">
          <Button variant="ghost" onClick={onPrev} disabled={!onPrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            이전
          </Button>
          <Button variant="ghost" onClick={onNext} disabled={!onNext}>
            다음
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-modal"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Ddori expression="excited" size={100} />
              <p className="text-2xl font-bold text-text-dark">잘했어!</p>
              <p className="text-sm text-text-medium">{rewardStars ? '스티커를 받았어요!' : '한 번 더 멋지게 연습했어요!'}</p>
              <div className="flex gap-1">
                {Array.from({ length: rewardStars }, (_, i) => i + 1).map((i) => (
                  <motion.svg
                    key={i}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="#FFD93D"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </motion.svg>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
