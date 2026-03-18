import { memo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useGamificationStore } from '@/stores/gamification-store';
import Badge from './Badge';

interface TopBarProps {
  className?: string;
  title?: string;
  showBack?: boolean;
  showStats?: boolean;
  rightSlot?: ReactNode;
  themeColor?: string;
  compact?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '좋은 아침!';
  if (hour < 17) return '즐거운 오후!';
  return '좋은 저녁!';
}

function TopBar({
  className,
  title,
  showBack = false,
  showStats = true,
  rightSlot,
  themeColor,
  compact = false,
}: TopBarProps) {
  const navigate = useNavigate();
  const totalStars = useGamificationStore((s) => s.totalStars);
  const level = useGamificationStore((s) => s.level);
  const streak = useGamificationStore((s) => s.streak);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between bg-white/90 px-4 backdrop-blur-md',
        'rounded-b-radius-xl shadow-sm',
        'pt-[var(--safe-area-top)]',
        compact ? 'h-12' : 'h-16',
        className,
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-warm transition-colors touch-manipulation"
            aria-label="뒤로 가기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke={themeColor || 'var(--color-text-dark)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : !compact ? (
          /* Mascot avatar */
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-yellow shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="8" fill="#FFD93D" />
              <circle cx="9" cy="8" r="1.5" fill="#2D3436" />
              <circle cx="15" cy="8" r="1.5" fill="#2D3436" />
              <circle cx="9" cy="7.2" r="0.6" fill="white" />
              <circle cx="15" cy="7.2" r="0.6" fill="white" />
              <path d="M9 13 Q12 16 15 13" stroke="#2D3436" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <circle cx="7" cy="5" r="3" fill="#FFD93D" />
              <circle cx="17" cy="5" r="3" fill="#FFD93D" />
            </svg>
          </div>
        ) : null}

        {title ? (
          <h1
            className={cn('font-bold', compact ? 'text-base' : 'text-lg')}
            style={{ color: themeColor || 'var(--color-text-dark)' }}
          >
            {title}
          </h1>
        ) : (
          <span className={cn('font-semibold text-text-dark', compact ? 'text-sm' : 'text-base')}>
            {getGreeting()}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {rightSlot}

        {showStats && (
          <>
            {/* Streak */}
            {streak > 0 && (
              <Badge variant="streak">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1C6 1 8.5 3.5 8.5 6C8.5 7.5 7.5 9 6 10C4.5 9 3.5 7.5 3.5 6C3.5 3.5 6 1 6 1Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-display font-bold">{streak}일</span>
              </Badge>
            )}

            {/* Level */}
            <Badge variant="level">Lv.{level}</Badge>

            {/* Stars */}
            <Badge variant="star">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L8.8 4.7L13 5.3L10 8.2L10.7 12.3L7 10.4L3.3 12.3L4 8.2L1 5.3L5.2 4.7L7 1Z"
                  fill="#FFD93D"
                  stroke="#E6C235"
                  strokeWidth="0.5"
                />
              </svg>
              <span className="font-display font-bold">{totalStars}</span>
            </Badge>
          </>
        )}
      </div>
    </header>
  );
}

export default memo(TopBar);
