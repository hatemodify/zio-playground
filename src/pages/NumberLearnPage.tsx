import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import LearningScreen from '@/components/features/LearningScreen';
import SpeakButton from '@/components/ui/SpeakButton';
import { getNumberByValue, NUMBERS_MAX } from '@/data';
import { voiceId } from '@/data/voice-lines';
import { cn } from '@/lib/cn';

/** A ten-frame holds two rows of five, so "10" becomes a shape the eye can read at a glance. */
const FRAME_SIZE = 10;

export default function NumberLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const numId = Number(id);
  const item = useMemo(() => getNumberByValue(numId), [numId]);

  const handleNext = useCallback(() => {
    if (numId < NUMBERS_MAX) {
      navigate(`/numbers/${numId + 1}`, { replace: true });
    } else {
      navigate('/numbers');
    }
  }, [numId, navigate]);

  const handlePrev = useCallback(() => {
    if (numId > 1) {
      navigate(`/numbers/${numId - 1}`, { replace: true });
    }
  }, [numId, navigate]);

  if (!item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-lg text-text-medium">숫자를 찾을 수 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4 flex-1 h-full justify-center">
      <LearningScreen
        id={item.id}
        character={item.character}
        category="numbers"
        onNext={numId < NUMBERS_MAX ? handleNext : undefined}
        onPrev={numId > 1 ? handlePrev : undefined}
        topContent={
          <div className="flex flex-col items-center gap-3 pt-2">
            <motion.span
              className="font-display text-[120px] font-extrabold leading-none text-numbers"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              key={item.id}
            >
              {item.character}
            </motion.span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-lg font-medium text-text-medium">
                {item.koreanName}
                <SpeakButton clip={voiceId.number('ko', item.number)} label={`${item.koreanName} 듣기`} size="sm" />
              </span>
              <span className="text-text-light">/</span>
              <span className="flex items-center gap-1.5 text-lg font-medium text-text-medium">
                {item.englishName}
                <SpeakButton clip={voiceId.number('en', item.number)} label={`${item.englishName} 듣기`} size="sm" />
              </span>
            </div>
          </div>
        }
        bottomContent={
          <CountingInteraction
            count={item.number}
            objectLabel={item.objectLabel}
          />
        }
      />
    </div>
  );
}

/* Counting Interaction - Touch objects one by one, laid out in ten-frames */
interface CountingProps {
  count: number;
  objectLabel: string;
  onComplete?: () => void;
}

function CountingInteraction({ count, objectLabel, onComplete }: CountingProps) {
  const [touched, setTouched] = useState<boolean[]>(Array(count).fill(false));
  const touchedCount = touched.filter(Boolean).length;
  const frames = Math.ceil(count / FRAME_SIZE);
  const tens = Math.floor(count / FRAME_SIZE);
  const ones = count % FRAME_SIZE;

  const handleTouch = useCallback((index: number) => {
    if (touched[index]) return;
    const newTouched = [...touched];
    newTouched[index] = true;
    setTouched(newTouched);

    const newCount = newTouched.filter(Boolean).length;
    if (newCount === count) {
      onComplete?.();
    }
  }, [touched, count, onComplete]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-bg-soft p-4">
      <span className="text-sm font-medium text-text-medium">
        {objectLabel}을(를) 하나씩 터치해 보세요!
      </span>
      <div className="flex flex-wrap items-start justify-center gap-3" data-ten-frames={frames}>
        {Array.from({ length: frames }, (_, frame) => {
          const start = frame * FRAME_SIZE;
          const size = Math.min(FRAME_SIZE, count - start);
          const full = size === FRAME_SIZE;
          const frameDone = touched.slice(start, start + size).every(Boolean);
          return (
            <div
              key={frame}
              className={cn(
                'relative grid grid-cols-5 gap-1.5 rounded-xl border-2 p-1.5 transition-colors',
                full ? 'border-numbers/40' : 'border-dashed border-numbers/25',
                frameDone && 'border-success/60 bg-success/5',
              )}
              role="group"
              aria-label={full ? `10개 묶음 ${frame + 1}` : `낱개 ${size}개`}
            >
              {full && (
                <span className={cn(
                  'absolute -top-2.5 left-2 rounded-full px-1.5 text-[11px] font-bold leading-4 text-white',
                  frameDone ? 'bg-success' : 'bg-numbers',
                )}>10</span>
              )}
              {Array.from({ length: size }, (_, k) => {
                const i = start + k;
                return (
                  <motion.button
                    key={i}
                    className={cn(
                      'flex items-center justify-center rounded-full text-2xl',
                      'touch-manipulation select-none transition-colors',
                      // Past 20 objects a full-size grid no longer fits a phone screen.
                      count > 20 ? 'h-9 w-9' : 'h-12 w-12',
                      touched[i]
                        ? 'bg-success/20 text-success'
                        : 'bg-numbers/15 text-numbers',
                    )}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTouch(i)}
                    aria-label={`${objectLabel} ${i + 1}`}
                  >
                    {touched[i] ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-lg font-bold">{i + 1}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>
      {count > FRAME_SIZE && (
        <span className="text-sm font-semibold text-numbers">
          10개 묶음 {tens}개{ones > 0 ? ` + 낱개 ${ones}개` : ''} = {count}
        </span>
      )}
      <span className="font-display text-xl font-bold text-text-dark">
        {touchedCount} / {count}
      </span>
    </div>
  );
}
