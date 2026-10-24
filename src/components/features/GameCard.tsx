import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import GameArtwork from '@/components/games/GameArtwork';
interface GameCardProps {
  gameId: string; name: string; description?: string; focus?: string; isNew?: boolean;
  illustration?: React.ReactNode; locked?: boolean; bestScore?: number; difficulty?: 1 | 2 | 3;
  onClick?: () => void; className?: string;
}
function GameCard({ gameId, name, description, focus, isNew, illustration, locked = false, bestScore, onClick, className }: GameCardProps) {
  return <motion.button aria-label={`${name}${locked ? ' (잠김)' : ''}`} disabled={locked} onClick={onClick} whileTap={{ scale: .98 }}
    className={cn('game-library-card group flex h-full w-full flex-col overflow-hidden text-left touch-manipulation', className)}>
    <div className="relative w-full">{illustration ?? <GameArtwork gameId={gameId} />}
      {isNew && <span className="game-library-new absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider">새로운 탐험</span>}</div>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <span className="game-library-focus text-xs font-extrabold">{focus ?? '생각하며 놀아요'}</span>
      <span className="text-base font-extrabold leading-snug text-slate-800 sm:text-lg">{name}</span>
      {description && <span className="text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</span>}
      <span className="mt-auto flex items-center justify-between pt-2 text-xs font-bold text-slate-500">
        <span>{bestScore ? `획득한 별 ${bestScore} / 3` : '처음부터 차근차근'}</span><span aria-hidden="true" className="game-library-arrow">→</span>
      </span>
    </div>
  </motion.button>;
}
export default memo(GameCard);
