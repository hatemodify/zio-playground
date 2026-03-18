import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

type DdoriExpression = 'happy' | 'excited' | 'encouraging' | 'thinking' | 'celebrating' | 'sleeping';
type DdoriSize = 'sm' | 'md' | 'lg';

interface CharacterDdoriProps {
  expression?: DdoriExpression;
  message?: string;
  size?: DdoriSize;
  animated?: boolean;
  className?: string;
}

const sizeConfig: Record<DdoriSize, { container: number; bear: number }> = {
  sm: { container: 48, bear: 40 },
  md: { container: 80, bear: 68 },
  lg: { container: 120, bear: 100 },
};

function getExpressionFace(expression: DdoriExpression, scale: number) {
  const cx = 50;
  const cy = 45;
  const s = scale;

  switch (expression) {
    case 'happy':
      return (
        <>
          {/* Eyes */}
          <circle cx={cx - 10 * s} cy={cy - 5 * s} r={3.5 * s} fill="#2D3436" />
          <circle cx={cx + 10 * s} cy={cy - 5 * s} r={3.5 * s} fill="#2D3436" />
          <circle cx={cx - 9 * s} cy={cy - 6.5 * s} r={1.2 * s} fill="white" />
          <circle cx={cx + 11 * s} cy={cy - 6.5 * s} r={1.2 * s} fill="white" />
          {/* Mouth */}
          <path d={`M${cx - 8 * s} ${cy + 5 * s} Q${cx} ${cy + 14 * s} ${cx + 8 * s} ${cy + 5 * s}`} stroke="#2D3436" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <circle cx={cx - 14 * s} cy={cy + 3 * s} r={3 * s} fill="#FF9FF3" fillOpacity="0.4" />
          <circle cx={cx + 14 * s} cy={cy + 3 * s} r={3 * s} fill="#FF9FF3" fillOpacity="0.4" />
        </>
      );
    case 'excited':
      return (
        <>
          {/* Wide eyes */}
          <circle cx={cx - 10 * s} cy={cy - 5 * s} r={4.5 * s} fill="#2D3436" />
          <circle cx={cx + 10 * s} cy={cy - 5 * s} r={4.5 * s} fill="#2D3436" />
          <circle cx={cx - 8.5 * s} cy={cy - 7 * s} r={1.8 * s} fill="white" />
          <circle cx={cx + 11.5 * s} cy={cy - 7 * s} r={1.8 * s} fill="white" />
          {/* Open mouth */}
          <ellipse cx={cx} cy={cy + 10 * s} rx={7 * s} ry={6 * s} fill="#2D3436" />
          <ellipse cx={cx} cy={cy + 8 * s} rx={5 * s} ry={3 * s} fill="#FF6B81" />
          {/* Cheeks */}
          <circle cx={cx - 14 * s} cy={cy + 3 * s} r={4 * s} fill="#FF6B81" fillOpacity="0.3" />
          <circle cx={cx + 14 * s} cy={cy + 3 * s} r={4 * s} fill="#FF6B81" fillOpacity="0.3" />
        </>
      );
    case 'encouraging':
      return (
        <>
          {/* Winking eye + normal eye */}
          <circle cx={cx - 10 * s} cy={cy - 5 * s} r={3.5 * s} fill="#2D3436" />
          <circle cx={cx - 9 * s} cy={cy - 6.5 * s} r={1.2 * s} fill="white" />
          <path d={`M${cx + 6 * s} ${cy - 5 * s} Q${cx + 10 * s} ${cy - 9 * s} ${cx + 14 * s} ${cy - 5 * s}`} stroke="#2D3436" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d={`M${cx - 6 * s} ${cy + 5 * s} Q${cx} ${cy + 12 * s} ${cx + 6 * s} ${cy + 5 * s}`} stroke="#2D3436" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <circle cx={cx - 14 * s} cy={cy + 3 * s} r={3 * s} fill="#FF9FF3" fillOpacity="0.4" />
        </>
      );
    case 'thinking':
      return (
        <>
          {/* Eyes looking up */}
          <circle cx={cx - 10 * s} cy={cy - 7 * s} r={3.5 * s} fill="#2D3436" />
          <circle cx={cx + 10 * s} cy={cy - 7 * s} r={3.5 * s} fill="#2D3436" />
          <circle cx={cx - 9 * s} cy={cy - 9 * s} r={1.2 * s} fill="white" />
          <circle cx={cx + 11 * s} cy={cy - 9 * s} r={1.2 * s} fill="white" />
          {/* Mouth - small circle */}
          <circle cx={cx + 2 * s} cy={cy + 8 * s} r={3 * s} fill="#2D3436" />
        </>
      );
    case 'celebrating':
      return (
        <>
          {/* Happy closed eyes (arcs) */}
          <path d={`M${cx - 14 * s} ${cy - 4 * s} Q${cx - 10 * s} ${cy - 10 * s} ${cx - 6 * s} ${cy - 4 * s}`} stroke="#2D3436" strokeWidth={2.5 * s} fill="none" strokeLinecap="round" />
          <path d={`M${cx + 6 * s} ${cy - 4 * s} Q${cx + 10 * s} ${cy - 10 * s} ${cx + 14 * s} ${cy - 4 * s}`} stroke="#2D3436" strokeWidth={2.5 * s} fill="none" strokeLinecap="round" />
          {/* Wide smile */}
          <path d={`M${cx - 10 * s} ${cy + 4 * s} Q${cx} ${cy + 16 * s} ${cx + 10 * s} ${cy + 4 * s}`} stroke="#2D3436" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <circle cx={cx - 15 * s} cy={cy + 2 * s} r={4 * s} fill="#FF6B81" fillOpacity="0.35" />
          <circle cx={cx + 15 * s} cy={cy + 2 * s} r={4 * s} fill="#FF6B81" fillOpacity="0.35" />
        </>
      );
    case 'sleeping':
      return (
        <>
          {/* Closed eyes (lines) */}
          <path d={`M${cx - 14 * s} ${cy - 5 * s} L${cx - 6 * s} ${cy - 5 * s}`} stroke="#2D3436" strokeWidth={2 * s} strokeLinecap="round" />
          <path d={`M${cx + 6 * s} ${cy - 5 * s} L${cx + 14 * s} ${cy - 5 * s}`} stroke="#2D3436" strokeWidth={2 * s} strokeLinecap="round" />
          {/* Small mouth */}
          <ellipse cx={cx} cy={cy + 7 * s} rx={4 * s} ry={2.5 * s} fill="#2D3436" fillOpacity="0.3" />
        </>
      );
  }
}

function CharacterDdori({
  expression = 'happy',
  message,
  size = 'md',
  animated = true,
  className,
}: CharacterDdoriProps) {
  const config = sizeConfig[size];

  const bearSvg = (
    <svg
      width={config.bear}
      height={config.bear}
      viewBox="0 0 100 100"
      fill="none"
    >
      {/* Ears */}
      <circle cx="25" cy="22" r="14" fill="#FFD93D" />
      <circle cx="25" cy="22" r="8" fill="#FFEAA0" />
      <circle cx="75" cy="22" r="14" fill="#FFD93D" />
      <circle cx="75" cy="22" r="8" fill="#FFEAA0" />

      {/* Head */}
      <circle cx="50" cy="50" r="35" fill="#FFD93D" />

      {/* Muzzle */}
      <ellipse cx="50" cy="56" rx="14" ry="10" fill="#FFEAA0" />

      {/* Nose */}
      <ellipse cx="50" cy="52" rx="4" ry="3" fill="#2D3436" />

      {/* Expression face */}
      {getExpressionFace(expression, 1)}
    </svg>
  );

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      {/* Character */}
      <motion.div
        className="relative"
        animate={
          animated
            ? expression === 'sleeping'
              ? { y: [0, -3, 0], rotate: [-2, 2, -2] }
              : { y: [0, -8, 0] }
            : undefined
        }
        transition={
          animated
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        {bearSvg}

        {/* ZZZ for sleeping */}
        {expression === 'sleeping' && (
          <motion.div
            className="absolute -right-2 -top-2 font-display text-sm font-bold text-text-light"
            animate={{ opacity: [0, 1, 0], y: [0, -8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Z z z
          </motion.div>
        )}
      </motion.div>

      {/* Speech bubble */}
      {message && (
        <motion.div
          className={cn(
            'relative max-w-[200px] rounded-radius-lg bg-white px-4 py-3 shadow-card',
            'text-center text-sm font-medium text-text-dark',
          )}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {message}
          {/* Tail */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[8px] border-b-[8px] border-x-transparent border-b-white" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default memo(CharacterDdori);
