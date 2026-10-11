import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

const COLORS = ['#FFD93D', '#FF6B81', '#4A90D9', '#2ED573', '#A29BFE', '#FF9FF3'];

export default function ConfettiShower({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return <div data-testid="confetti-shower" aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
    {Array.from({ length: 72 }, (_, index) => <motion.span
      key={index}
      className="absolute block"
      style={{
        width: 8 + index % 7,
        height: 8 + index % 4,
        backgroundColor: COLORS[index % COLORS.length],
        left: `${(index * 37) % 100}%`,
        top: '-5%',
        borderRadius: index % 3 === 0 ? '50%' : 2,
      }}
      initial={{ y: '-5vh', rotate: 0, opacity: 0 }}
      animate={{ x: [0, (index % 2 ? 1 : -1) * 60, 0], y: '110vh', rotate: index * 43, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.8 + (index % 4) * 0.3, delay: (index % 12) * 0.06, ease: 'easeOut' }}
    />)}
  </div>;
}
