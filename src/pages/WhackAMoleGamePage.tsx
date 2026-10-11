import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PictureToken } from '@/components/games/Picture';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import ConfettiShower from '@/components/features/ConfettiShower';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/cn';

const VEHICLES = ['🚗', '🚌', '🚜', '✈️', '🚁', '🚂', '🚒', '🚑', '🏎️'];
const HOLE_COUNT = 9;
const MAX_LIVES = 3;
const STAGES = [
  { name: '연습 마당', englishName: 'Practice Yard', goal: 4, seconds: 20, spawnMin: 750, spawnRange: 450, visibleMs: 2100, bombChance: 0.1 },
  { name: '빠른 마당', englishName: 'Speed Yard', goal: 6, seconds: 20, spawnMin: 560, spawnRange: 330, visibleMs: 1800, bombChance: 0.16 },
  { name: '챔피언 마당', englishName: 'Champion Yard', goal: 8, seconds: 20, spawnMin: 420, spawnRange: 230, visibleMs: 1500, bombChance: 0.22 },
] as const;
const TOTAL_GOAL = STAGES.reduce((total, stage) => total + stage.goal, 0);

interface Mole { id: number; holeIndex: number; emoji: string; isBomb: boolean }
interface Feedback { id: number; holeIndex: number; type: 'hit' | 'bomb' }
type Phase = 'playing' | 'stage-clear' | 'game-over' | 'complete';

export default function WhackAMoleGamePage() {
  const navigate = useNavigate();
  const language = useSettingsStore((state) => state.language);
  const { state: gameState, start, addScore, wrongAnswer, finish, score, calculateStars, earnedStickers } = useGameLogic({ gameId: 'whack-a-mole', category: 'play' });
  const { play } = useSound();
  const reducedMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [timeLeft, setTimeLeft] = useState<number>(STAGES[0].seconds);
  const [lives, setLives] = useState(MAX_LIVES);
  const [stageHits, setStageHits] = useState(0);
  const [activeMoles, setActiveMoles] = useState<Mole[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [failureReason, setFailureReason] = useState<'time' | 'lives'>('time');
  const [showReward, setShowReward] = useState(true);
  const deadline = useRef(0);
  const moleId = useRef(0);
  const hitIds = useRef(new Set<number>());
  const livesRef = useRef(MAX_LIVES);
  const stageHitsRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = STAGES[stageIndex];
  const canPlay = gameState === 'playing' && phase === 'playing' && lives > 0;
  const copy = (ko: string, en: string) => language === 'en' ? en : ko;

  const startGame = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    if (gameOverTimer.current) clearTimeout(gameOverTimer.current);
    moleId.current = 0;
    hitIds.current.clear();
    livesRef.current = MAX_LIVES;
    stageHitsRef.current = 0;
    deadline.current = Date.now() + STAGES[0].seconds * 1000;
    setStageIndex(0);
    setPhase('playing');
    setTimeLeft(STAGES[0].seconds);
    setLives(MAX_LIVES);
    setStageHits(0);
    setActiveMoles([]);
    setFeedback(null);
    setShowReward(true);
    start(TOTAL_GOAL);
  }, [start]);

  useEffect(() => {
    startGame();
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (gameOverTimer.current) clearTimeout(gameOverTimer.current);
    };
  }, [startGame]);

  useEffect(() => {
    if (!canPlay) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && livesRef.current > 0 && stageHitsRef.current < stage.goal) {
        setFailureReason('time');
        setPhase('game-over');
        setActiveMoles([]);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [canPlay, stage]);

  useEffect(() => {
    if (!canPlay) return;
    let live = true;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (live) callback();
      }, delay);
      timers.add(timer);
    };
    const spawn = () => {
      const id = ++moleId.current;
      const holeIndex = Math.floor(Math.random() * HOLE_COUNT);
      const isBomb = Math.random() < stage.bombChance;
      const emoji = isBomb ? '💣' : VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
      setActiveMoles((current) => [...current.filter((mole) => mole.holeIndex !== holeIndex), { id, holeIndex, emoji, isBomb }]);
      schedule(() => setActiveMoles((current) => current.filter((mole) => mole.id !== id)), stage.visibleMs);
      schedule(spawn, stage.spawnMin + Math.random() * stage.spawnRange);
    };
    schedule(spawn, 350);
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
  }, [canPlay, stage]);

  const handleWhack = (mole: Mole) => {
    if (!canPlay || livesRef.current <= 0 || hitIds.current.has(mole.id)) return;
    hitIds.current.add(mole.id);
    setActiveMoles((current) => current.filter((item) => item.id !== mole.id));
    setFeedback({ id: mole.id, holeIndex: mole.holeIndex, type: mole.isBomb ? 'bomb' : 'hit' });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback((current) => current?.id === mole.id ? null : current), 700);

    if (mole.isBomb) {
      wrongAnswer();
      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);
      if (nextLives === 0) {
        setFailureReason('lives');
        gameOverTimer.current = setTimeout(() => {
          setPhase('game-over');
          setActiveMoles([]);
        }, 750);
      }
      return;
    }

    play('balloon_pop');
    addScore(1);
    const nextHits = stageHitsRef.current + 1;
    stageHitsRef.current = nextHits;
    setStageHits(nextHits);
    if (nextHits < stage.goal) return;

    setActiveMoles([]);
    if (stageIndex === STAGES.length - 1) {
      setPhase('complete');
      finish();
    } else {
      setPhase('stage-clear');
      play('confetti');
    }
  };

  const nextStage = () => {
    if (phase !== 'stage-clear') return;
    const nextIndex = stageIndex + 1;
    deadline.current = Date.now() + STAGES[nextIndex].seconds * 1000;
    hitIds.current.clear();
    stageHitsRef.current = 0;
    setStageIndex(nextIndex);
    setStageHits(0);
    setTimeLeft(STAGES[nextIndex].seconds);
    setActiveMoles([]);
    setFeedback(null);
    setPhase('playing');
  };

  if (phase === 'game-over') return <section className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center gap-5 px-5 text-center">
    <span className="text-7xl" aria-hidden="true">{failureReason === 'lives' ? '💥' : '⏰'}</span>
    <h2 className="text-3xl font-extrabold text-amber-950">{copy('한 번 더 도전해요!', 'Try again!')}</h2>
    <p className="text-base font-bold text-amber-800">{failureReason === 'lives' ? copy('폭탄에 하트를 모두 잃었어요.', 'The bombs took all your hearts.') : copy('시간이 끝났어요. 탈것을 더 잡아 봐요!', 'Time is up. Try catching more vehicles!')}</p>
    <div className="flex gap-3"><Button variant="primary" size="lg" onClick={startGame}>{copy('다시 하기', 'Play again')}</Button><Button variant="secondary" size="lg" onClick={() => navigate('/games')}>{copy('게임 목록', 'Games')}</Button></div>
  </section>;

  if (gameState === 'success' || gameState === 'reward') return <section className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center gap-5 px-5 text-center">
    <RewardCelebration type="game_complete" stars={calculateStars(score)} newStickers={earnedStickers} open={gameState === 'reward' && showReward} onDismiss={() => setShowReward(false)} />
    <span className="text-7xl" aria-hidden="true">🏆</span>
    <h2 className="text-3xl font-extrabold text-amber-950">{copy('3단계 모두 성공!', 'All 3 stages cleared!')}</h2>
    <p className="text-lg font-bold text-amber-800">{copy(`${score}마리 잡았어요!`, `You caught ${score} vehicles!`)}</p>
    <div className="flex gap-3"><Button variant="primary" size="lg" onClick={startGame}>{copy('다시 하기', 'Play again')}</Button><Button variant="secondary" size="lg" onClick={() => navigate('/games')}>{copy('게임 목록', 'Games')}</Button></div>
  </section>;

  return <section className="mx-auto w-full max-w-[780px] px-2 pb-8 pt-2 sm:px-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-3 shadow-sm sm:px-5">
      <div><h2 className="text-2xl font-extrabold text-games sm:text-3xl">{copy('두더지 잡기', 'Whack-a-Mole')}</h2><p className="text-sm font-bold text-amber-800">{copy(`${stageIndex + 1}단계 · ${stage.name}`, `Stage ${stageIndex + 1} · ${stage.englishName}`)}</p></div>
      <div className="flex items-center gap-3 text-sm font-extrabold sm:text-lg"><span>{score}{copy('점', ' pts')}</span><span className={cn('rounded-full px-3 py-1', timeLeft <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-200 text-amber-900')}>{timeLeft}{copy('초', 's')}</span></div>
    </div>
    <div className="mb-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-extrabold text-amber-950">{copy(`탈것 ${stageHits} / ${stage.goal}`, `Vehicles ${stageHits} / ${stage.goal}`)}</span><span aria-label={copy(`라이프 ${lives}개`, `${lives} lives`)} className="text-xl tracking-widest text-rose-500">{'♥'.repeat(lives)}<span className="text-slate-300">{'♡'.repeat(MAX_LIVES - lives)}</span></span></div>
      <div className="h-3 overflow-hidden rounded-full bg-amber-100" role="progressbar" aria-label={copy('단계 목표', 'Stage goal')} aria-valuenow={stageHits} aria-valuemin={0} aria-valuemax={stage.goal}><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-200" style={{ width: `${stageHits / stage.goal * 100}%` }} /></div>
    </div>

    <div className="relative mx-auto grid w-full max-w-[680px] grid-cols-3 gap-2.5 rounded-[28px] border-4 border-amber-400 bg-gradient-to-b from-amber-200 to-orange-300 p-2.5 shadow-[0_10px_0_#bd7338] sm:gap-4 sm:p-4" aria-label={copy('두더지 잡기 게임판', 'Whack-a-Mole board')}>
      {Array.from({ length: HOLE_COUNT }, (_, index) => {
        const mole = activeMoles.find((item) => item.holeIndex === index);
        const effect = feedback?.holeIndex === index ? feedback : null;
        return <motion.button key={index} type="button" aria-label={copy(`구멍 ${index + 1}`, `Hole ${index + 1}`)} data-kind={mole ? mole.isBomb ? 'bomb' : 'vehicle' : 'empty'} data-feedback={effect?.type} disabled={!canPlay || !mole} onClick={() => mole && handleWhack(mole)} whileTap={canPlay && mole ? { scale: 0.95 } : undefined} className={cn('relative flex aspect-square min-h-[104px] items-center justify-center overflow-hidden rounded-[24px] border-[3px] border-amber-600/35 bg-gradient-to-b from-amber-50 to-amber-200 shadow-inner touch-manipulation select-none', effect?.type === 'bomb' && 'border-rose-500 bg-rose-200', effect?.type === 'hit' && 'border-emerald-400 bg-emerald-100')}>
          <span className="absolute bottom-3 h-[22%] w-[75%] rounded-[50%] bg-amber-950/30 blur-[1px]" aria-hidden="true" />
          <AnimatePresence>{mole && <motion.span key={mole.id} className="relative z-10 text-5xl leading-none sm:text-7xl" initial={reducedMotion ? false : { y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducedMotion ? undefined : { y: 50, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}><PictureToken value={mole.emoji} /></motion.span>}</AnimatePresence>
          <AnimatePresence>{effect?.type === 'hit' && <motion.span key={`hit-${effect.id}`} className="absolute z-20 text-2xl font-black text-emerald-700" initial={reducedMotion ? false : { scale: 0.5, y: 0 }} animate={{ scale: 1.4, y: -18, opacity: reducedMotion ? 1 : 0 }} transition={{ duration: 0.65 }}>+1</motion.span>}</AnimatePresence>
          <AnimatePresence>{effect?.type === 'bomb' && <motion.span key={`bomb-${effect.id}`} className="absolute inset-0 z-20 grid place-items-center bg-rose-500/35" initial={reducedMotion ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><span className="text-5xl drop-shadow-lg sm:text-7xl" aria-hidden="true">💥</span><span className="absolute bottom-2 rounded-full bg-rose-700 px-2 py-0.5 text-sm font-black text-white">-1 ♥</span></motion.span>}</AnimatePresence>
        </motion.button>;
      })}
      {phase === 'stage-clear' && <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-[24px] bg-amber-950/80 px-5 text-center text-white" role="dialog" aria-label={copy('단계 성공', 'Stage cleared')}>
        <ConfettiShower />
        <span className="relative z-10 text-6xl" aria-hidden="true">🌟</span>
        <h3 className="relative z-10 text-2xl font-extrabold sm:text-4xl">{copy(`${stageIndex + 1}단계 성공!`, `Stage ${stageIndex + 1} cleared!`)}</h3>
        <p className="relative z-10 text-sm font-semibold">{copy('다음 단계에서는 탈것이 더 빨리 나와요.', 'Vehicles come out faster in the next stage.')}</p>
        <Button variant="primary" size="lg" className="relative z-10" onClick={nextStage}>{copy('다음 단계', 'Next stage')}</Button>
      </div>}
    </div>
    <div className="mt-5 flex justify-center"><CharacterDdori expression={stageIndex === 2 ? 'excited' : 'happy'} size="sm" message={copy('탈것을 잡고 폭탄은 피하세요!', 'Catch vehicles and avoid bombs!')} /></div>
  </section>;
}
