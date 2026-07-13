import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}

const buttonClass =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white text-text-dark shadow-card ' +
  'transition-opacity touch-manipulation disabled:opacity-30 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export default function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: UndoRedoControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        type="button"
        className={buttonClass}
        onClick={onUndo}
        disabled={!canUndo}
        whileTap={canUndo ? { scale: 0.9 } : undefined}
        aria-label="되돌리기"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h9a6 6 0 0 1 0 12h-3" />
        </svg>
      </motion.button>

      <motion.button
        type="button"
        className={buttonClass}
        onClick={onRedo}
        disabled={!canRedo}
        whileTap={canRedo ? { scale: 0.9 } : undefined}
        aria-label="다시 실행"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 14 5-5-5-5" />
          <path d="M20 9h-9a6 6 0 0 0 0 12h3" />
        </svg>
      </motion.button>
    </div>
  );
}
