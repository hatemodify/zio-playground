import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settings-store';
import { useGamificationStore } from '@/stores/gamification-store';

interface SessionResult {
  bonusStars: number;
  newStreak: number;
  isNewDay: boolean;
}

export function useSession(): SessionResult {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const checkAndClaimDailyBonus = useGamificationStore((s) => s.checkAndClaimDailyBonus);
  const lastLoginDate = useGamificationStore((s) => s.lastLoginDate);
  const streak = useGamificationStore((s) => s.streak);

  const dailyResult = useRef<{ bonusStars: number; newStreak: number; isNewDay: boolean }>({
    bonusStars: 0,
    newStreak: 0,
    isNewDay: false,
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!onboarded && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [onboarded, location.pathname, navigate]);

  // Check daily login bonus
  useEffect(() => {
    if (!onboarded) return;

    const today = new Date().toISOString().split('T')[0];
    if (lastLoginDate !== today) {
      const result = checkAndClaimDailyBonus();
      dailyResult.current = {
        bonusStars: result.bonusStars,
        newStreak: result.newStreak,
        isNewDay: true,
      };
    } else {
      dailyResult.current = {
        bonusStars: 0,
        newStreak: streak,
        isNewDay: false,
      };
    }
  }, [onboarded, lastLoginDate, streak, checkAndClaimDailyBonus]);

  return dailyResult.current;
}
