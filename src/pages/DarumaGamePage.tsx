import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AdventureFrame, AdventureIntro, type Difficulty } from '@/components/games/AdventureFrame';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { shuffled } from '@/data/picture-content';

const LEVELS = {
  easy: { blocks: 5 },
  normal: { blocks: 7 },
  hard: { blocks: 9 },
};
const COLORS = [
  { id: 'red', label: '빨강', value: '#ef6f6c' },
  { id: 'blue', label: '파랑', value: '#6fa8dc' },
  { id: 'green', label: '초록', value: '#79b77a' },
  { id: 'yellow', label: '노랑', value: '#e7bd55' },
  { id: 'purple', label: '보라', value: '#9b8ed0' },
  { id: 'pink', label: '분홍', value: '#d88bb0' },
] as const;
type ColorId = typeof COLORS[number]['id'];
interface Block { id: number; color: ColorId }
interface Hit { id: number; color: ColorId; good: boolean }
/** A run draws STAGES_PER_RUN scenes out of this pool, so the trio differs each time. */
const STAGES = [
  { id: 'garden', name: '무지개 정원' },
  { id: 'beach', name: '조개빛 바닷가' },
  { id: 'night', name: '별빛 밤하늘' },
  { id: 'forest', name: '초록 숲속 오솔길' },
  { id: 'snow', name: '소복소복 눈마을' },
  { id: 'sunset', name: '노을빛 언덕' },
  { id: 'space', name: '두둥실 우주 정거장' },
];
const STAGES_PER_RUN = 3;
type Stage = typeof STAGES[number] & { blocks: Block[] };

function colorInfo(id: ColorId) {
  return COLORS.find((color) => color.id === id) ?? COLORS[0];
}
function buildBlocks(count: number): Block[] {
  const colors = shuffled(COLORS);
  return shuffled(Array.from({ length: count }, (_, id) => ({ id, color: colors[id % colors.length].id })));
}

export default function DarumaGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageCleared, setStageCleared] = useState(false);
  const [totalMisses, setTotalMisses] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hit, setHit] = useState<Hit | null>(null);
  const [paused, setPaused] = useState(false);
  const [fallen, setFallen] = useState(false);
  const [message, setMessage] = useState('달마 아래 블록과 같은 색 버튼을 눌러요!');
  const [showReward, setShowReward] = useState(true);
  const lock = useRef(false);
  const hitId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'daruma', category: 'play' });
  const { finish } = game;
  const { play } = useSound();
  const reducedMotion = useReducedMotion();
  const level = LEVELS[difficulty];
  const stage = stages[stageIndex];
  const totalBlocks = stages.reduce((total, item) => total + item.blocks.length, 0);
  const finished = game.state === 'success' || game.state === 'reward';
  const target = blocks[0];
  const active = game.state === 'playing' && !stageCleared && !paused && !fallen && !hit && !!target;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (game.state !== 'playing' || stageCleared || fallen) return;
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [game.state, stageCleared, fallen]);

  const chooseColor = useCallback((color: ColorId) => {
    if (!active || lock.current || !target) return;
    lock.current = true;
    const good = target.color === color;
    const nextBlocks = good ? blocks.slice(1) : blocks;
    setHit({ id: ++hitId.current, color, good });
    if (good) {
      setBlocks(nextBlocks);
      play('balloon_pop');
      setMessage(nextBlocks.length ? `${colorInfo(color).label} 블록을 쏙 뺐어요! 다음 색을 찾아요.` : '마지막 블록까지 쏙! 달마를 지켰어요!');
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setTotalMisses((value) => value + 1);
      play('wrong');
      setMessage(`${colorInfo(color).label}은(는) 아니에요. 달마 아래 블록과 같은 색을 찾아요.`);
      if (nextMisses >= 3) { setFallen(true); setMessage('색을 세 번 놓쳤어요. 달마가 넘어졌어요!'); }
    }
    timer.current = setTimeout(() => {
      setHit(null); lock.current = false;
      if (good && nextBlocks.length === 0) {
        if (stageIndex + 1 === stages.length) finish(Math.max(1, totalBlocks - totalMisses));
        else { setStageCleared(true); play('confetti'); }
      }
    }, reducedMotion ? 120 : 520);
  }, [active, blocks, finish, misses, play, reducedMotion, target, stageIndex, stages.length, totalBlocks, totalMisses]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < COLORS.length) { event.preventDefault(); chooseColor(COLORS[index].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chooseColor]);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    lock.current = false;
    const nextStages = shuffled(STAGES).slice(0, STAGES_PER_RUN).map((item, index) => ({ ...item, blocks: buildBlocks(Math.min(9, level.blocks + index)) }));
    setStages(nextStages); setStageIndex(0); setStageCleared(false); setTotalMisses(0);
    setBlocks(nextStages[0].blocks); setMisses(0); setHit(null); setPaused(false); setFallen(false); setShowReward(true);
    setMessage('달마 아래 블록과 같은 색 버튼을 눌러요!');
    game.start(nextStages.reduce((total, item) => total + item.blocks.length, 0));
  }

  function nextStage() {
    if (!stageCleared || stageIndex + 1 >= stages.length) return;
    setBlocks(stages[stageIndex + 1].blocks); setStageIndex(stageIndex + 1);
    setMisses(0); setPaused(false); setStageCleared(false);
    setMessage('새로운 스테이지! 맨 아래 블록과 같은 색을 눌러요.');
  }

  return <AdventureFrame title="톡! 톡! 달마치기" subtitle="같은 색 버튼을 찾아 달마의 블록을 하나씩 쏙 빼요.">
    {game.state === 'ready' ? <AdventureIntro picture="star" title="같은 색을 찾아 달마를 지켜요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['맨 아래 블록과 같은 색을 누르면 망치가 쳐내요.', `${STAGES.length}곳 중 ${STAGES_PER_RUN}곳이 매번 새로 뽑혀요. 순서와 블록 색도 달라져요.`, '스테이지마다 기회는 세 번! 모두 통과하면 성공이에요.']}>
      <div className="daruma-intro-art" aria-hidden="true"><img src="/assets/illustrations/daruma.svg" alt="" /><div className="daruma-mini-block" /><div className="daruma-mini-block" /><div className="daruma-mini-block" /></div>
      <p className="text-center text-sm font-bold text-amber-800">{STAGES.length}곳 중 랜덤 {STAGES_PER_RUN}스테이지 · {level.blocks}개 블록부터 시작 · 시간 제한 없음</p>
    </AdventureIntro> : <section className="daruma-workshop">
      <div className="daruma-stage-heading" aria-label="스테이지 진행"><span>스테이지 {stageIndex + 1} / {stages.length}</span><strong>{stage?.name}</strong></div>
      <div className="daruma-scoreboard"><span>남은 블록 <strong>{blocks.length}</strong> / {stage?.blocks.length}</span><span aria-label={`남은 기회 ${3 - misses}번`}>{'♥'.repeat(3 - misses)}{'♡'.repeat(misses)}</span>{!finished && !fallen && !stageCleared && <button onClick={() => setPaused(!paused)} disabled={!!hit} className="rounded-xl bg-white/70 px-3 py-2 text-xs">{paused ? '계속하기' : '잠깐 쉬기'}</button>}</div>
      <div className={`daruma-stage daruma-scene-${stage?.id}`} aria-label="색깔 블록이 쌓인 달마">
        <div className="daruma-sun" aria-hidden="true" /><div className="daruma-cloud" aria-hidden="true" /><div className="daruma-platform" aria-hidden="true" />
        <motion.div className="daruma-tower" animate={reducedMotion ? { rotate: 0, x: 0 } : fallen ? { rotate: 65, x: 65, y: 30 } : hit && !hit.good ? { rotate: [0, -8, 8, -5, 0] } : { rotate: 0, x: 0, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.img layout={reducedMotion ? false : 'position'} src="/assets/illustrations/daruma.svg" alt="달마" className="daruma-doll" transition={{ type: 'spring', stiffness: 280, damping: 18 }} />
          <div role="list" aria-label="남은 블록" className="flex flex-col">{blocks.slice().reverse().map((block) => { const color = colorInfo(block.color); const isTarget = block.id === target?.id; return <motion.div layout={reducedMotion ? false : 'position'} key={block.id} role="listitem" aria-label={`${color.label} 블록${isTarget ? ', 지금 제거할 블록' : ''}`} data-color={color.label} className={`daruma-block ${isTarget && !fallen ? 'daruma-block-target' : ''}`} style={{ backgroundColor: color.value }}><span>{color.label}</span></motion.div>; })}</div>
        </motion.div>
        <AnimatePresence>{hit?.good && !reducedMotion && <motion.div key={hit.id} className="daruma-block daruma-ejected" style={{ backgroundColor: colorInfo(hit.color).value }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: 250, y: -55, rotate: 24, opacity: 0 }} transition={{ delay: 0.1, duration: 0.4 }} />}</AnimatePresence>
        {!finished && !stageCleared && <motion.img key={hit?.id ?? 'rest'} src="/assets/illustrations/daruma-mallet.svg" alt="달마 망치" className="daruma-mallet" data-striking={!!hit} initial={{ rotate: -25, x: 0 }} animate={hit && !reducedMotion ? { rotate: [-35, 25, -25], x: [0, 28, 0] } : { rotate: -25, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.32 }} />}
        {hit?.good && <motion.span key={`burst-${hit.id}`} className="daruma-burst" initial={reducedMotion ? false : { scale: 0.6 }} animate={{ scale: 1 }}>쏙!</motion.span>}
        {paused && !finished && <div className="daruma-pause"><strong>달마도 잠깐 쉬는 중</strong><button className="adventure-primary" onClick={() => setPaused(false)}>이어서 하기</button></div>}
      </div>
      <p className="daruma-feedback" role="status">{message}</p>
      {finished ? <div className="p-4 text-center"><h2 className="text-2xl font-extrabold text-amber-950">달마치기 성공!</h2><p className="my-2 text-sm text-amber-900">3스테이지, {totalBlocks}개 블록을 모두 쳐냈어요!</p><button className="adventure-primary mt-2" onClick={game.reset}>다시 놀기</button><RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={showReward} onDismiss={() => setShowReward(false)} message="세 스테이지의 달마를 모두 지켜냈어요!" /></div>
      : stageCleared ? <div className="p-5 text-center"><h2 className="text-xl font-extrabold text-teal-800">스테이지 {stageIndex + 1} 성공!</h2><p className="my-3 text-sm">다음은 {stages[stageIndex + 1]?.name}! 기회가 다시 세 번 생겨요.</p><button className="adventure-primary" onClick={nextStage}>다음 스테이지</button></div>
      : fallen ? <div className="px-4 pb-5 text-center"><h2 className="mb-3 text-xl font-extrabold text-amber-950">다시 쌓으면 괜찮아요!</h2><button className="adventure-primary" onClick={start}>다시 쌓기</button><button className="adventure-secondary ml-2" onClick={game.reset}>난이도 바꾸기</button></div>
      : <div className="daruma-controls">
        <p className="daruma-target-label">지금 제거할 색 <strong style={{ color: target ? colorInfo(target.color).value : undefined }}>{target ? colorInfo(target.color).label : '완료'}</strong></p>
        <div className="daruma-color-buttons" role="group" aria-label="블록 색상 선택">{COLORS.map((color, index) => <button key={color.id} className="daruma-color-button" style={{ '--daruma-color': color.value } as React.CSSProperties} aria-label={`${color.label} 버튼`} onClick={() => chooseColor(color.id)} disabled={!active}><span className="daruma-color-swatch" aria-hidden="true" />{color.label}<small>{index + 1}</small></button>)}</div>
        <p className="mt-3 text-center text-xs text-amber-800">달마 아래 블록과 같은 색을 눌러요 · 숫자 1~6</p>
      </div>}
    </section>}
  </AdventureFrame>;
}
