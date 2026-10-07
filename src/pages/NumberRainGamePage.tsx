import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AdventureFrame, AdventureIntro } from '@/components/games/AdventureFrame';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';

/**
 * Ten stages that get harder bit by bit: more digits, faster drops, shorter
 * gaps and more numbers to clear. Speed is in % of the sky's height per second.
 */
const STAGES = [
  { digits: [1, 2, 3], speed: 8, interval: 2.4, count: 6 },
  { digits: [1, 2, 3, 4, 5], speed: 9, interval: 2.2, count: 7 },
  { digits: [1, 2, 3, 4, 5], speed: 10.5, interval: 2, count: 8 },
  { digits: [1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 11, interval: 1.9, count: 8 },
  { digits: [1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 12.5, interval: 1.7, count: 9 },
  { digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 13.5, interval: 1.55, count: 10 },
  { digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 15, interval: 1.4, count: 10 },
  { digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 16.5, interval: 1.25, count: 11 },
  { digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 18, interval: 1.1, count: 12 },
  { digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], speed: 20, interval: 1, count: 12 },
];
const TOTAL_NUMBERS = STAGES.reduce((total, stage) => total + stage.count, 0);
const LIVES = 3;
const COLUMNS = 5;
const GROUND = 100;
const KEYPAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const DROP_COLORS = ['#ef6f6c', '#6fa8dc', '#79b77a', '#e7a53c', '#9b8ed0', '#d88bb0'];

interface Drop { id: number; digit: number; column: number; y: number; color: string }
interface Pop { id: number; digit: number; column: number; y: number; color: string }
type Phase = 'falling' | 'cleared' | 'over';

export default function NumberRainGamePage() {
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('falling');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [hearts, setHearts] = useState(LIVES);
  const [handled, setHandled] = useState(0);
  const [popped, setPopped] = useState(0);
  const [miss, setMiss] = useState(0);
  const [wrongKey, setWrongKey] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const world = useRef({ drops: [] as Drop[], spawned: 0, handled: 0, spawnTimer: 0, id: 0, popped: 0, hearts: LIVES, lastColumn: -1 });
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'number-rain', category: 'play' });
  const { finish } = game;
  const { play } = useSound();
  const reducedMotion = useReducedMotion();
  const stage = STAGES[stageIndex];
  const finished = game.state === 'success' || game.state === 'reward';
  const running = game.state === 'playing' && phase === 'falling' && !paused;

  useEffect(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);
  useEffect(() => {
    if (!running) return;
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    let last = 0;
    let animation = 0;
    function frame(now: number) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const current = world.current;
      current.spawnTimer += dt;
      if (current.spawned < stage.count && (current.spawnTimer >= stage.interval || current.drops.length === 0)) {
        current.spawnTimer = 0;
        current.spawned += 1;
        // Skip the last column used so two numbers never stack on each other.
        let column = Math.floor(Math.random() * (COLUMNS - 1));
        if (column >= current.lastColumn && current.lastColumn >= 0) column += 1;
        current.lastColumn = column;
        const digit = stage.digits[Math.floor(Math.random() * stage.digits.length)];
        current.drops.push({ id: ++current.id, digit, column, y: -12, color: DROP_COLORS[current.id % DROP_COLORS.length] });
      }
      let missed = 0;
      current.drops = current.drops.filter((drop) => {
        drop.y += dt * stage.speed;
        if (drop.y < GROUND) return true;
        missed += 1;
        return false;
      });
      if (missed) {
        current.hearts = Math.max(0, current.hearts - missed);
        current.handled += missed;
        setHearts(current.hearts); setHandled(current.handled); setMiss((value) => value + 1);
        play('wrong');
      }
      setDrops(current.drops.map((drop) => ({ ...drop })));
      if (current.hearts <= 0) { setPhase('over'); finish(current.popped); return; }
      if (current.spawned >= stage.count && current.drops.length === 0) {
        if (stageIndex + 1 === STAGES.length) finish(current.popped);
        else { setPhase('cleared'); play('confetti'); }
        return;
      }
      animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animation);
  }, [running, stage, stageIndex, finish, play]);

  const press = useCallback((digit: number) => {
    if (!running) return;
    const current = world.current;
    // The number closest to the ground goes first.
    const target = current.drops.filter((drop) => drop.digit === digit).sort((a, b) => b.y - a.y)[0];
    if (!target) {
      play('wrong');
      setWrongKey(digit);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongKey(null), 350);
      return;
    }
    current.drops = current.drops.filter((drop) => drop.id !== target.id);
    current.popped += 1;
    current.handled += 1;
    setDrops(current.drops.map((drop) => ({ ...drop })));
    setPopped(current.popped); setHandled(current.handled);
    setPops((list) => [...list, { ...target }]);
    play('balloon_pop');
  }, [running, play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) { event.preventDefault(); press(Number(event.key)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  function resetStage(index: number) {
    world.current = { ...world.current, drops: [], spawned: 0, handled: 0, spawnTimer: 0, lastColumn: -1 };
    setStageIndex(index); setDrops([]); setPops([]); setHandled(0); setPaused(false); setPhase('falling');
  }

  function start() {
    world.current = { drops: [], spawned: 0, handled: 0, spawnTimer: 0, id: 0, popped: 0, hearts: LIVES, lastColumn: -1 };
    setHearts(LIVES); setPopped(0); setMiss(0); setShowReward(true);
    resetStage(0);
    game.start(TOTAL_NUMBERS);
  }

  return <AdventureFrame title="숫자 비" subtitle="하늘에서 떨어지는 숫자를 키패드로 눌러 없애요.">
    {game.state === 'ready' ? <AdventureIntro picture="umbrella" title="숫자 비가 내려요!" difficulty="easy" onDifficulty={() => {}} onStart={start} showDifficulty={false}
      instructions={['떨어지는 숫자와 같은 숫자를 아래 키패드에서 눌러요.', '숫자가 땅에 닿으면 하트가 하나 줄어요. 하트는 3개!', `${STAGES.length}스테이지까지 갈수록 빨라지고 숫자가 많아져요.`]} />
    : finished ? <section className="adventure-intro text-center">
      <h2 className="text-2xl font-extrabold text-slate-800">{hearts > 0 ? `${STAGES.length}스테이지 모두 성공!` : `스테이지 ${stageIndex + 1}까지 왔어요!`}</h2>
      <p className="my-3 text-slate-600">숫자 {popped}개를 없앴어요. {hearts > 0 ? '숫자 비를 모두 막아냈어요!' : '잠깐 쉬고 다시 해 볼까요?'}</p>
      <button className="adventure-primary" onClick={start}>처음부터 다시</button>
      <button className="adventure-secondary ml-2" onClick={game.reset}>나가기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} />
    </section> : <section className="number-rain">
      <div className="number-rain-hud">
        <span aria-label="스테이지 진행">스테이지 <strong>{stageIndex + 1}</strong> / {STAGES.length}</span>
        <span aria-label={`없앤 숫자 ${handled}개 중 ${stage.count}개`}>{handled} / {stage.count}</span>
        <motion.span key={miss} aria-label={`남은 하트 ${hearts}개`} className="number-rain-hearts" animate={miss && !reducedMotion ? { scale: [1, 1.3, 1] } : undefined}>{'♥'.repeat(hearts)}{'♡'.repeat(LIVES - hearts)}</motion.span>
        {phase === 'falling' && <button className="adventure-secondary number-rain-pause" onClick={() => setPaused(!paused)}>{paused ? '계속하기' : '잠깐 쉬기'}</button>}
      </div>
      <div className="number-rain-sky" aria-label="숫자가 떨어지는 하늘">
        <ul role="list" aria-label="떨어지는 숫자" className="contents">
          {drops.map((drop) => <li key={drop.id} aria-label={`숫자 ${drop.digit}`} data-digit={drop.digit} className="number-rain-drop"
            style={{ left: `${(drop.column + 0.5) * 100 / COLUMNS}%`, top: `${drop.y}%`, '--drop-color': drop.color } as React.CSSProperties}>{drop.digit}</li>)}
        </ul>
        <AnimatePresence>{pops.map((pop) => <motion.span key={`pop-${pop.id}`} aria-hidden="true" className="number-rain-pop"
          style={{ left: `${(pop.column + 0.5) * 100 / COLUMNS}%`, top: `${pop.y}%`, color: pop.color }}
          initial={{ scale: 1, opacity: 1 }} animate={{ scale: reducedMotion ? 1 : 1.8, opacity: 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.35 }}
          onAnimationComplete={() => setPops((list) => list.filter((item) => item.id !== pop.id))}>펑!</motion.span>)}</AnimatePresence>
        <div className="number-rain-ground" aria-hidden="true" />
        {paused && <div className="number-rain-overlay"><strong>잠깐 쉬는 중</strong><button className="adventure-primary" onClick={() => setPaused(false)}>이어서 하기</button></div>}
        {phase === 'cleared' && <div className="number-rain-overlay"><h2 className="text-2xl font-extrabold">스테이지 {stageIndex + 1} 성공!</h2>
          <p>다음 스테이지는 조금 더 빨라요.</p><button className="adventure-primary" onClick={() => resetStage(stageIndex + 1)}>다음 스테이지</button></div>}
      </div>
      <div className="number-rain-keypad" role="group" aria-label="숫자 키패드">
        {KEYPAD.map((digit) => <button key={digit} className="number-rain-key" data-wrong={wrongKey === digit} aria-label={`${digit} 누르기`}
          disabled={!running || !stage.digits.includes(digit)} onClick={() => press(digit)}>{digit}</button>)}
      </div>
    </section>}
  </AdventureFrame>;
}
