import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AdventureFrame, AdventureIntro, type Difficulty } from '@/components/games/AdventureFrame';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';

const LEVELS = {
  easy: { blocks: 5, cycle: 2600, min: 28, max: 82 },
  normal: { blocks: 7, cycle: 2100, min: 36, max: 72 },
  hard: { blocks: 9, cycle: 1700, min: 42, max: 65 },
};
const COLORS = ['#ef9d54', '#71b6db', '#91bb74', '#d88bb0', '#e3bc5c', '#9392ce', '#77beb0', '#de8171', '#86aacb'];
type Direction = 'left' | 'right';
interface Hit { id: number; direction: Direction; good: boolean; color: string }

export default function DarumaGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cleared, setCleared] = useState(0);
  const [misses, setMisses] = useState(0);
  const [power, setPower] = useState(0);
  const [hit, setHit] = useState<Hit | null>(null);
  const [paused, setPaused] = useState(false);
  const [fallen, setFallen] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const [feedback, setFeedback] = useState('초록 구간에 오면 망치로 톡!');
  const lock = useRef(false);
  const elapsed = useRef(0);
  const powerRef = useRef(0);
  const hitId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'daruma', category: 'play' });
  const { finish } = game;
  const { play } = useSound();
  const reducedMotion = useReducedMotion();
  const level = LEVELS[difficulty];
  const finished = game.state === 'success' || game.state === 'reward';
  const active = game.state === 'playing' && !paused && !fallen && !hit;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!active) return;
    let previous = performance.now();
    const tick = window.setInterval(() => {
      const now = performance.now(); elapsed.current += now - previous; previous = now;
      const phase = (elapsed.current % level.cycle) / level.cycle;
      const value = Math.round((1 - Math.abs(phase * 2 - 1)) * 100);
      powerRef.current = value; setPower(value);
    }, 40);
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', hide); };
  }, [active, level.cycle]);

  const strike = useCallback((direction: Direction) => {
    if (!active || lock.current) return;
    lock.current = true;
    const value = powerRef.current;
    const good = value >= level.min && value <= level.max;
    setHit({ id: ++hitId.current, direction, good, color: COLORS[cleared] });
    if (good) {
      setCleared(cleared + 1); play('balloon_pop');
      setFeedback(cleared + 1 === level.blocks ? '달마를 지켰어요! 멋지게 성공!' : '딱 좋아요! 블록이 쏙 빠졌어요.');
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses); play('wrong');
      setFeedback(value < level.min ? '조금 약했어요. 초록 구간까지 기다려 봐요!' : '너무 셌어요! 초록 구간에서 다시 쳐요.');
      if (nextMisses >= 3) { setFallen(true); setFeedback('달마가 넘어졌어요. 다시 쌓아 도전해 봐요!'); }
    }
    timer.current = setTimeout(() => {
      setHit(null); elapsed.current = 0; powerRef.current = 0; setPower(0); lock.current = false;
      if (good && cleared + 1 === level.blocks) finish(Math.max(1, level.blocks - misses));
    }, reducedMotion ? 120 : 650);
  }, [active, cleared, misses, level, play, finish, reducedMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault(); strike(event.code === 'ArrowLeft' ? 'left' : 'right');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [strike]);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    lock.current = false; elapsed.current = 0; powerRef.current = 0;
    setCleared(0); setMisses(0); setPower(0); setHit(null); setPaused(false); setFallen(false); setShowReward(true);
    setFeedback('초록 구간에 오면 망치로 톡!'); game.start(level.blocks);
  }

  return <AdventureFrame title="톡! 톡! 달마치기" subtitle="블록은 쏙, 달마는 사뿐! 망치로 균형을 지켜요.">
    {game.state === 'ready' ? <AdventureIntro picture="star" title="달마를 바닥까지 내려 주세요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['맨 아래 블록을 망치로 옆으로 쳐내요.', '힘 게이지가 초록 구간일 때 버튼을 톡 눌러요.', '달마가 세 번 흔들리면 넘어져요. 천천히 다시 도전해요.']}>
      <div className="daruma-intro-art" aria-hidden="true"><img src="/assets/illustrations/daruma.svg" alt="" /><div className="daruma-mini-block" /><div className="daruma-mini-block" /><img className="daruma-intro-mallet" src="/assets/illustrations/daruma-mallet.svg" alt="" /></div>
      <p className="text-center text-sm font-bold text-amber-800">{level.blocks}개 블록 · 시간 제한 없음 · 터치 / 방향키 ← →</p>
    </AdventureIntro> : <section className="daruma-workshop">
      <div className="daruma-scoreboard"><span>남은 블록 <strong>{level.blocks - cleared}</strong> / {level.blocks}</span><span aria-label={`남은 기회 ${3 - misses}번`}>{'♥'.repeat(3 - misses)}{'♡'.repeat(misses)}</span>{!finished && !fallen && <button onClick={() => setPaused(!paused)} disabled={!!hit} className="rounded-xl bg-white/70 px-3 py-2 text-xs">{paused ? '계속하기' : '잠깐 쉬기'}</button>}</div>
      <div className="daruma-stage" aria-label="달마와 블록">
        <div className="daruma-sun" aria-hidden="true" /><div className="daruma-cloud" aria-hidden="true" /><div className="daruma-platform" aria-hidden="true" />
        <motion.div className="daruma-tower" animate={reducedMotion ? { rotate: 0, x: 0 } : fallen ? { rotate: 65, x: 65, y: 30 } : hit && !hit.good ? { rotate: [0, -8, 8, -5, 0] } : { rotate: 0, x: 0, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.img layout={reducedMotion ? false : 'position'} src="/assets/illustrations/daruma.svg" alt="달마" className="daruma-doll" transition={{ type: 'spring', stiffness: 280, damping: 18 }} />
          <div role="list" aria-label="남은 블록" className="flex flex-col">{Array.from({ length: level.blocks - cleared }, (_, index) => level.blocks - 1 - index).map((id) => <motion.div layout={reducedMotion ? false : 'position'} key={id} role="listitem" aria-label={`${id + 1}번 블록${id === cleared ? ' 지금 칠 블록' : ''}`} className={`daruma-block ${id === cleared && !fallen ? 'daruma-block-target' : ''}`} style={{ backgroundColor: COLORS[id] }}><span>{id + 1}</span></motion.div>)}</div>
        </motion.div>
        <AnimatePresence>{hit?.good && !reducedMotion && <motion.div key={hit.id} className="daruma-block daruma-ejected" style={{ backgroundColor: hit.color }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: hit.direction === 'left' ? 290 : -290, y: -60, rotate: hit.direction === 'left' ? 100 : -100, opacity: 0 }} transition={{ duration: 0.6 }} />}</AnimatePresence>
        {!finished && <motion.img key={hit?.id ?? 'rest'} src="/assets/illustrations/daruma-mallet.svg" alt="" aria-hidden="true" className={`daruma-mallet ${hit?.direction === 'right' ? 'daruma-mallet-right' : ''}`} animate={hit && !reducedMotion ? { rotate: [-35, 25, -15], x: [0, 28, 0] } : { rotate: -25, x: 0 }} transition={{ duration: 0.32 }} />}
        {hit?.good && <motion.span key={`burst-${hit.id}`} className="daruma-burst" initial={reducedMotion ? false : { scale: 0.6 }} animate={{ scale: 1 }}>쏙!</motion.span>}
        {paused && !finished && <div className="daruma-pause"><strong>달마도 잠깐 쉬는 중</strong><button className="adventure-primary" onClick={() => setPaused(false)}>이어서 하기</button></div>}
      </div>
      <p className="daruma-feedback" role="status">{feedback}</p>
      {finished ? <div className="p-4 text-center"><h2 className="text-2xl font-extrabold text-amber-950">달마치기 성공!</h2><p className="my-2 text-sm text-amber-900">{level.blocks}개 블록을 모두 쳐냈어요.</p><button className="adventure-primary mt-2" onClick={game.reset}>다시 놀기</button><RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={showReward} onDismiss={() => setShowReward(false)} message="달마를 끝까지 지켜냈어요!" /></div>
      : fallen ? <div className="px-4 pb-5 text-center"><h2 className="mb-3 text-xl font-extrabold text-amber-950">다시 쌓으면 괜찮아요!</h2><button className="adventure-primary" onClick={start}>다시 쌓기</button><button className="adventure-secondary ml-2" onClick={game.reset}>난이도 바꾸기</button></div>
      : <div className="daruma-controls">
        <div className="mb-3 flex justify-between text-xs font-bold text-amber-900"><span>살살</span><span className="text-teal-700">초록 구간에서 톡!</span><span>세게</span></div>
        <div className="daruma-meter" role="meter" aria-label="망치 힘" aria-valuemin={0} aria-valuemax={100} aria-valuenow={power} aria-valuetext={`${power}, ${power >= level.min && power <= level.max ? '지금 쳐요' : '기다려요'}`}>
          <div className="daruma-sweet-spot" style={{ left: `${level.min}%`, width: `${level.max - level.min}%` }}><span>✓</span></div><div className="daruma-needle" style={{ left: `${power}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3"><button className="daruma-hit-button" disabled={!active} onClick={() => strike('left')}>왼쪽에서 치기 →</button><button className="daruma-hit-button" disabled={!active} onClick={() => strike('right')}>← 오른쪽에서 치기</button></div>
        <p className="mt-3 text-center text-xs text-amber-800">방향키 ← 왼쪽 망치 · → 오른쪽 망치</p>
      </div>}
    </section>}
  </AdventureFrame>;
}
