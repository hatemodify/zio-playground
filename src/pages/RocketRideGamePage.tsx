import { useCallback, useEffect, useRef, useState } from 'react';
import Picture from '@/components/games/Picture';
import { AdventureFrame, AdventureIntro, type Difficulty } from '@/components/games/AdventureFrame';
import { useGameLogic } from '@/hooks/use-game-logic';
import RewardCelebration from '@/components/features/RewardCelebration';

interface FallingObject { id: number; lane: number; y: number; kind: 'star' | 'meteor' }
export default function RocketRideGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [lane, setLane] = useState(1);
  const laneRef = useRef(1);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [remaining, setRemaining] = useState(30);
  const [hearts, setHearts] = useState(3);
  const [paused, setPaused] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const [hit, setHit] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const world = useRef({ objects: [] as FallingObject[], elapsed: 0, spawn: 0, hearts: 3, safeUntil: 0, id: 0 });
  const { state, score, start, finish, addScore, wrongAnswer, reset, calculateStars, earnedStickers } = useGameLogic({ gameId: 'rocket-ride', category: 'play' });
  const move = useCallback((next: number) => { laneRef.current = Math.max(0, Math.min(2, next)); setLane(laneRef.current); }, []);
  function begin() {
    world.current = { objects: [], elapsed: 0, spawn: 0, hearts: 3, safeUntil: 0, id: 0 };
    move(1); setObjects([]); setRemaining(30); setHearts(3); setPaused(false); setHit(false); setShowReward(true); start(12);
  }
  useEffect(() => {
    if (state === 'playing') fieldRef.current?.focus();
  }, [state]);
  useEffect(() => {
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    if (state !== 'playing' || paused) return;
    let last = 0;
    let animation = 0;
    const speed = difficulty === 'easy' ? 23 : difficulty === 'normal' ? 30 : 39;
    function frame(now: number) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const current = world.current;
      current.elapsed += dt; current.spawn += dt;
      if (current.spawn >= 0.85) {
        current.spawn = 0;
        current.objects.push({ id: ++current.id, lane: Math.floor(Math.random() * 3), y: -10, kind: current.id % (difficulty === 'easy' ? 4 : 3) === 0 ? 'meteor' : 'star' });
      }
      current.objects = current.objects.filter((object) => {
        object.y += dt * speed;
        if (object.y >= 76 && object.y <= 91 && object.lane === laneRef.current) {
          if (object.kind === 'star') addScore();
          else if (current.elapsed >= current.safeUntil) { current.hearts -= 1; current.safeUntil = current.elapsed + 1.4; wrongAnswer(); }
          return false;
        }
        return object.y < 112;
      });
      setObjects([...current.objects]); setRemaining(Math.max(0, Math.ceil(30 - current.elapsed))); setHearts(current.hearts);
      setHit(current.elapsed < current.safeUntil);
      if (current.elapsed >= 30 || current.hearts <= 0) { finish(); return; }
      animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animation);
  }, [state, paused, difficulty, addScore, wrongAnswer, finish]);

  return <AdventureFrame title="반짝 우주 비행" subtitle="우주선을 움직여 별을 모으고 운석을 피해요">
    {state === 'ready' ? <AdventureIntro picture="rocket" title="출발, 꼬마 우주선!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={begin}
      instructions={['왼쪽·오른쪽 버튼 또는 방향키로 움직여요.', '반짝이는 별을 모으고 갈색 운석을 피해요.', '하트 3개로 30초 동안 신나게 비행해요.']} />
    : state === 'success' || state === 'reward' ? <section className="adventure-intro text-center">
      <Picture id="rocket" className="h-32 w-32" /><h2 className="mt-4 text-2xl font-extrabold">별 {score}개를 모았어요!</h2>
      <p className="my-3 text-slate-600">{hearts === 0 ? '잠깐 쉬고 다시 떠나 볼까요?' : '멋진 우주 여행이었어요!'}</p>
      <button className="adventure-primary" onClick={reset}>다시 비행하기</button>
      <RewardCelebration type="game_complete" stars={calculateStars(score)} newStickers={earnedStickers} open={state === 'reward' && showReward} onDismiss={() => setShowReward(false)} />
    </section> : <>
      <div className="flex items-center justify-between gap-2 font-bold"><span>별 {score}개</span><span aria-label={`남은 하트 ${hearts}개`}>{'♥'.repeat(hearts)}{'♡'.repeat(3 - hearts)}</span><span>{remaining}초</span>
        <button className="adventure-secondary" onClick={() => setPaused((value) => !value)}>{paused ? '계속하기' : '잠깐 쉬기'}</button></div>
      <div ref={fieldRef} tabIndex={0} role="application" aria-label="우주 비행장. 좌우 방향키로 이동" className="scene-night relative h-[min(52dvh,480px)] min-h-64 overflow-hidden rounded-3xl outline-none"
        onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); if (!paused) move(laneRef.current + (event.key === 'ArrowLeft' ? -1 : 1)); } }}>
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'url(/assets/kenney/space/background.png)' }} />
        {[0, 1, 2].map((column) => <button key={column} aria-label={`${column + 1}번 비행 길로 이동`} className="absolute inset-y-0 w-1/3 border-r border-white/10" style={{ left: `${column * 100 / 3}%` }} onClick={() => { if (!paused) move(column); }} />)}
        {objects.map((object) => <div key={object.id} className="pointer-events-none absolute -translate-x-1/2" style={{ left: `${(object.lane + 0.5) * 100 / 3}%`, top: `${object.y}%` }}><Picture id={object.kind} className="h-12 w-12 sm:h-16 sm:w-16" /></div>)}
        <div className={`pointer-events-none absolute top-[80%] -translate-x-1/2 transition-[left] duration-100 ${hit ? 'opacity-40' : ''}`} style={{ left: `${(lane + 0.5) * 100 / 3}%` }}><Picture id="rocket" label="내 우주선" className="h-16 w-16 sm:h-20 sm:w-20" /></div>
        {paused && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/75"><button className="adventure-primary" onClick={() => setPaused(false)}>계속 비행하기</button></div>}
      </div>
      <div className="grid grid-cols-2 gap-3"><button className="adventure-secondary text-xl" disabled={paused || lane === 0} onClick={() => move(laneRef.current - 1)}>← 왼쪽</button><button className="adventure-secondary text-xl" disabled={paused || lane === 2} onClick={() => move(laneRef.current + 1)}>오른쪽 →</button></div>
    </>}
  </AdventureFrame>;
}
