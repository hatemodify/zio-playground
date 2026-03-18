import { useState, useCallback, useRef } from 'react';
import type { GameState } from '@/types/game';
import { useSound } from './use-sound';
import { useGamificationStore } from '@/stores/gamification-store';

interface UseGameLogicOptions {
  onComplete?: (stars: number) => void;
}

/**
 * Shared game state machine: ready → playing → success/fail → reward.
 * Tracks score, elapsed time, and provides helpers.
 */
export function useGameLogic(options?: UseGameLogicOptions) {
  const [state, setState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [earnedStickers, setEarnedStickers] = useState<string[]>([]);
  const { play } = useSound();
  const { addStars, checkAndGrantStickers } = useGamificationStore();

  const start = useCallback((total: number) => {
    setState('playing');
    setScore(0);
    setMaxScore(total);
    startTimeRef.current = Date.now();
    setElapsed(0);
  }, []);

  const addScore = useCallback((points: number = 1) => {
    setScore((prev) => prev + points);
    play('correct');
  }, [play]);

  const wrongAnswer = useCallback(() => {
    play('wrong');
  }, [play]);

  const calculateStars = useCallback(
    (currentScore: number): number => {
      if (maxScore === 0) return 1;
      const ratio = currentScore / maxScore;
      if (ratio >= 0.9) return 3;
      if (ratio >= 0.6) return 2;
      return 1;
    },
    [maxScore],
  );

  const finish = useCallback(
    (finalScore?: number) => {
      const actualScore = finalScore ?? score;
      const duration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      setElapsed(duration);

      const stars = calculateStars(actualScore);
      setState('success');
      addStars(stars);
      play('level_up');

      // Check and grant stickers after stars are added
      const newStickers = checkAndGrantStickers();
      setEarnedStickers(newStickers);

      options?.onComplete?.(stars);

      // Auto-transition to reward
      setTimeout(() => setState('reward'), 1500);
    },
    [score, calculateStars, addStars, checkAndGrantStickers, play, options],
  );

  const reset = useCallback(() => {
    setState('ready');
    setScore(0);
    setElapsed(0);
    startTimeRef.current = null;
  }, []);

  return {
    state,
    score,
    maxScore,
    elapsed,
    earnedStickers,
    start,
    addScore,
    wrongAnswer,
    finish,
    reset,
    calculateStars,
  };
}
