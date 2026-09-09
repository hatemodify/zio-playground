import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameId } from '@/types/game';
import type { LearningCategory } from '@/types/learning';
import { useSound } from './use-sound';
import { useGamificationStore } from '@/stores/gamification-store';

interface UseGameLogicOptions {
  gameId: GameId;
  category?: LearningCategory | 'discovery' | 'play';
}

/** One completion transaction per round, independent of reward dismissal. */
export function useGameLogic({ gameId, category = 'numbers' }: UseGameLogicOptions) {
  const [state, setState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [earnedStickers, setEarnedStickers] = useState<string[]>([]);
  const scoreRef = useRef(0);
  const totalRef = useRef(0);
  const roundRef = useRef({ id: '', startedAt: 0, finished: true });
  const rewardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useSound();
  const completeGame = useGamificationStore((s) => s.completeGame);
  const clearRewardTimer = useCallback(() => {
    if (rewardTimer.current) clearTimeout(rewardTimer.current);
    rewardTimer.current = null;
  }, []);
  useEffect(() => () => { roundRef.current.finished = true; clearRewardTimer(); }, [clearRewardTimer]);

  const start = useCallback((total: number) => {
    clearRewardTimer();
    roundRef.current = { id: crypto.randomUUID(), startedAt: Date.now(), finished: false };
    scoreRef.current = 0;
    totalRef.current = total;
    setState('playing');
    setScore(0);
    setMaxScore(total);
    setElapsed(0);
    setEarnedStickers([]);
  }, [clearRewardTimer]);

  const addScore = useCallback((points = 1) => {
    if (roundRef.current.finished) return;
    scoreRef.current += points;
    setScore(scoreRef.current);
    play('correct');
  }, [play]);
  const wrongAnswer = useCallback(() => play('wrong'), [play]);
  const calculateStars = useCallback((currentScore: number) => {
    if (totalRef.current === 0) return 1;
    const ratio = currentScore / totalRef.current;
    return ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
  }, []);

  const finish = useCallback((finalScore?: number) => {
    const round = roundRef.current;
    if (round.finished) return;
    round.finished = true;
    const actualScore = finalScore ?? scoreRef.current;
    scoreRef.current = actualScore;
    setScore(actualScore);
    const duration = Math.round((Date.now() - round.startedAt) / 1000);
    setElapsed(duration);
    setEarnedStickers(completeGame({ runId: round.id, gameId, category,
      score: actualScore, stars: calculateStars(actualScore), duration,
      completedAt: new Date().toISOString() }));
    setState('success');
    play('level_up');
    rewardTimer.current = setTimeout(() => setState('reward'), 1500);
  }, [gameId, category, calculateStars, completeGame, play]);

  const reset = useCallback(() => {
    clearRewardTimer();
    roundRef.current.finished = true;
    scoreRef.current = 0;
    setState('ready');
    setScore(0);
    setElapsed(0);
    setEarnedStickers([]);
  }, [clearRewardTimer]);

  return { state, score, maxScore, elapsed, earnedStickers, start, addScore, wrongAnswer, finish, reset, calculateStars };
}
