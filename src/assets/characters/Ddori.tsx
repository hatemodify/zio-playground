import { cn } from '@/lib/cn';

interface DdoriProps {
  className?: string;
  expression?: 'happy' | 'excited' | 'encourage' | 'sleeping' | 'thinking';
  size?: number;
}

/**
 * Mascot character "또리" (Ddori) — a cute bear.
 * SVG inline component with expression variants.
 */
export default function Ddori({ className, expression = 'happy', size = 120 }: DdoriProps) {
  const eyeVariants: Record<string, { left: string; right: string }> = {
    happy: { left: 'M36,42 Q38,46 40,42', right: 'M60,42 Q62,46 64,42' },
    excited: { left: 'M34,40 L40,40', right: 'M60,40 L66,40' },
    encourage: { left: 'M36,42 Q38,44 40,42', right: 'M64,38 A4,4 0 1,1 56,38' },
    sleeping: { left: 'M34,42 Q38,44 42,42', right: 'M58,42 Q62,44 66,42' },
    thinking: { left: 'M36,40 A3,3 0 1,1 42,40', right: 'M60,42 Q62,46 64,42' },
  };

  const mouthVariants: Record<string, string> = {
    happy: 'M42,56 Q50,64 58,56',
    excited: 'M40,54 Q50,68 60,54',
    encourage: 'M44,56 Q50,62 56,56',
    sleeping: 'M46,58 Q50,60 54,58',
    thinking: 'M44,58 Q50,56 56,58',
  };

  const eyes = eyeVariants[expression];
  const mouth = mouthVariants[expression];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('inline-block', className)}
      aria-label="또리 캐릭터"
      role="img"
    >
      {/* Ears */}
      <circle cx="28" cy="22" r="14" fill="#C4A882" />
      <circle cx="28" cy="22" r="8" fill="#E8D5B7" />
      <circle cx="72" cy="22" r="14" fill="#C4A882" />
      <circle cx="72" cy="22" r="8" fill="#E8D5B7" />

      {/* Head */}
      <ellipse cx="50" cy="52" rx="34" ry="36" fill="#D4B896" />

      {/* Face area */}
      <ellipse cx="50" cy="58" rx="22" ry="20" fill="#F5E6D0" />

      {/* Eyes */}
      <path d={eyes.left} stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d={eyes.right} stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="50" cy="50" rx="4" ry="3" fill="#8B6F5E" />

      {/* Mouth */}
      <path d={mouth} stroke="#2D3436" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Blush */}
      <circle cx="32" cy="52" r="5" fill="#FFB5B5" opacity="0.5" />
      <circle cx="68" cy="52" r="5" fill="#FFB5B5" opacity="0.5" />

      {/* Sparkle for excited */}
      {expression === 'excited' && (
        <>
          <path d="M80,20 L82,16 L84,20 L88,18 L84,22 L82,26 L80,22 L76,18 Z" fill="#FFD93D" />
          <path d="M16,28 L18,24 L20,28 L24,26 L20,30 L18,34 L16,30 L12,26 Z" fill="#FFD93D" />
        </>
      )}

      {/* Zzz for sleeping */}
      {expression === 'sleeping' && (
        <text x="70" y="30" fontSize="12" fontWeight="bold" fill="#B2BEC3" fontFamily="Nunito">
          z
        </text>
      )}
    </svg>
  );
}
