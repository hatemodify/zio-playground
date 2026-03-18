import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface NavItem {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  activeColor: string;
  activeBg: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: '홈',
    activeColor: 'text-primary',
    activeBg: 'bg-primary/10',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M4 12L14 4L24 12V23C24 23.6 23.6 24 23 24H5C4.4 24 4 23.6 4 23V12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.15 : 0}
        />
        <path d="M10 24V16H18V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/numbers',
    label: '숫자',
    activeColor: 'text-numbers',
    activeBg: 'bg-numbers/10',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <text
          x="14"
          y="20"
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontWeight={active ? '800' : '600'}
          fontSize="18"
          fill="currentColor"
        >
          123
        </text>
      </svg>
    ),
  },
  {
    path: '/hangul',
    label: '한글',
    activeColor: 'text-hangul',
    activeBg: 'bg-hangul/10',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <text
          x="14"
          y="20"
          textAnchor="middle"
          fontFamily="Pretendard, sans-serif"
          fontWeight={active ? '700' : '500'}
          fontSize="16"
          fill="currentColor"
        >
          ㄱㄴ
        </text>
      </svg>
    ),
  },
  {
    path: '/english',
    label: '영어',
    activeColor: 'text-english',
    activeBg: 'bg-english/10',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <text
          x="14"
          y="20"
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontWeight={active ? '800' : '600'}
          fontSize="16"
          fill="currentColor"
        >
          ABC
        </text>
      </svg>
    ),
  },
  {
    path: '/games',
    label: '게임',
    activeColor: 'text-games',
    activeBg: 'bg-games/10',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect
          x="4"
          y="8"
          width="20"
          height="14"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.15 : 0}
        />
        <circle cx="10" cy="15" r="2" fill={active ? 'white' : 'currentColor'} />
        <circle cx="18" cy="13" r="1.5" fill={active ? 'white' : 'currentColor'} />
        <circle cx="18" cy="17" r="1.5" fill={active ? 'white' : 'currentColor'} />
      </svg>
    ),
  },
];

interface BottomNavProps {
  landscape?: boolean;
}

function BottomNav({ landscape = false }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (landscape) {
    return (
      <nav
        className="sticky left-0 top-0 z-40 flex h-dvh w-20 shrink-0 flex-col items-center gap-1 overflow-y-auto bg-white/95 py-4 shadow-card pl-[var(--safe-area-left)]"
        aria-label="메인 네비게이션"
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.path}
              className={cn(
                'relative flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-radius-lg px-1',
                'touch-manipulation select-none transition-colors duration-200',
                active ? item.activeColor : 'text-text-light',
              )}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {active && (
                <motion.div
                  className={cn('absolute inset-1 rounded-radius-md', item.activeBg)}
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon(active)}</span>
              <span
                className={cn(
                  'relative z-10 text-[10px] transition-all duration-200',
                  active ? 'font-bold' : 'font-medium',
                )}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'sticky bottom-0 z-40 flex h-16 items-center justify-around',
        'bg-white/95 backdrop-blur-md',
        'rounded-t-radius-xl shadow-nav',
        'pb-[var(--safe-area-bottom)]',
      )}
      aria-label="메인 네비게이션"
    >
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <motion.button
            key={item.path}
            className={cn(
              'relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-radius-lg px-3',
              'touch-manipulation select-none transition-colors duration-200',
              active ? item.activeColor : 'text-text-light',
            )}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {active && (
              <motion.div
                className={cn('absolute inset-1 rounded-radius-md', item.activeBg)}
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.icon(active)}</span>
            <span
              className={cn(
                'relative z-10 text-[11px] transition-all duration-200',
                active ? 'font-bold' : 'font-medium',
              )}
            >
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

export default memo(BottomNav);
