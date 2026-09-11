import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AdventureFrame, AdventureIntro, type Difficulty } from '@/components/games/AdventureFrame';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';

const BUTTONS = [
  { name: '빨강', shape: '●', key: 'a', color: '#F2667B' },
  { name: '초록', shape: '▲', key: 's', color: '#40BCA0' },
  { name: '파랑', shape: '■', key: 'd', color: '#609BEF' },
];
const ROUNDS = [
  { title: '톡톡! 색깔 풍선', instruction: '풍선과 같은 색·모양의 버튼을 눌러요!', image: 'balloon', label: '풍선' },
  { title: '슝슝! 로켓 충전', instruction: '세 버튼 중 아무 버튼이나 여러 번 눌러 충전해요!', image: 'rocket', label: '충전' },
  { title: '반짝! 무지개 암호', instruction: '왼쪽부터 색·모양 순서대로 버튼을 눌러요!', image: 'rainbow', label: '암호' },
];
interface PlayState {
  round: number; phase: 'briefing' | 'playing' | 'round-result'; sequence: number[];
  hits: number; target: number; remaining: number; combo: number; bestCombo: number; feedback: string;
}
type Action = { type: 'begin' } | { type: 'press'; color: number } | { type: 'tick'; seconds: number } | { type: 'round'; state: PlayState };
function newRound(round: number, difficulty: Difficulty): PlayState {
  const count = difficulty === 'easy' ? 6 : difficulty === 'normal' ? 8 : 10;
  return { round, phase: 'briefing', sequence: Array.from({ length: count }, () => Math.floor(Math.random() * 3)), hits: 0,
    target: round === 1 ? count * 3 : count, remaining: difficulty === 'easy' ? 30 : difficulty === 'normal' ? 25 : 20,
    combo: 0, bestCombo: 0, feedback: '' };
}
function reducer(state: PlayState, action: Action): PlayState {
  if (action.type === 'round') return action.state;
  if (action.type === 'begin') return { ...state, phase: 'playing' };
  if (state.phase !== 'playing') return state;
  if (action.type === 'tick') {
    const remaining = Math.max(0, state.remaining - action.seconds);
    return { ...state, remaining, phase: remaining <= 0 ? 'round-result' : 'playing' };
  }
  if (state.round !== 1 && action.color !== state.sequence[state.hits]) return { ...state, combo: 0, feedback: '괜찮아요! 색과 모양을 다시 봐요.' };
  const hits = state.hits + 1;
  return { ...state, hits, combo: state.combo + 1, bestCombo: Math.max(state.bestCombo, state.combo + 1), feedback: hits >= state.target ? '미션 성공!' : '좋아요!', phase: hits >= state.target ? 'round-result' : 'playing' };
}

export default function MiniFestivalGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [session, dispatch] = useReducer(reducer, undefined, () => newRound(0, 'easy'));
  const [paused, setPaused] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const handledRound = useRef(-1);
  const [results, setResults] = useState<boolean[]>([]);
  const { state, score, start, addScore, finish, reset, calculateStars, earnedStickers } = useGameLogic({ gameId: 'mini-festival', category: 'play' });
  const { play } = useSound();
  const reducedMotion = useReducedMotion();
  const round = ROUNDS[session.round];
  const won = session.hits >= session.target;
  const finished = state === 'success' || state === 'reward';

  const press = useCallback((color: number) => {
    if (state !== 'playing' || paused || session.phase !== 'playing') return;
    const correct = session.round === 1 || color === session.sequence[session.hits];
    play(correct ? 'balloon_pop' : 'wrong');
    dispatch({ type: 'press', color });
  }, [state, paused, session, play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const color = BUTTONS.findIndex((button) => `Key${button.key.toUpperCase()}` === event.code);
      if (color !== -1) { event.preventDefault(); press(color); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);
  useEffect(() => {
    if (state !== 'playing' || session.phase !== 'playing' || paused) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', seconds: (now - previous) / 1000 }); previous = now;
    }, 100);
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [state, session.phase, paused]);
  useEffect(() => {
    if (session.phase !== 'round-result' || handledRound.current === session.round) return;
    handledRound.current = session.round;
    setResults((old) => [...old, won]);
    if (won) { addScore(); play('confetti'); }
    if (session.round === 2) finish();
  }, [session.phase, session.round, won, addScore, finish, play]);

  function beginFestival() {
    handledRound.current = -1; setResults([]); setPaused(false); setShowReward(true);
    dispatch({ type: 'round', state: newRound(0, difficulty) }); start(3);
  }
  return <AdventureFrame title="팡팡! 미니게임 축제" subtitle="세 개의 버튼, 세 가지 미션! 신나는 도전을 시작해요.">
    {state === 'ready' ? <AdventureIntro picture="star" title="오늘의 미니게임 챔피언은?" difficulty={difficulty} onDifficulty={setDifficulty} onStart={beginFestival}
      instructions={['색깔 풍선 → 로켓 충전 → 무지개 암호, 세 게임에 도전해요.', '화면의 큰 버튼이나 키보드 A · S · D로 놀아요.', '각 게임은 20~30초! 시간이 끝나도 다음 게임에 도전할 수 있어요.']}>
      <div className="mt-5 grid grid-cols-3 gap-3">{ROUNDS.map((item, index) => <div key={item.title} className="rounded-2xl bg-indigo-50 p-3 text-center"><img src={`/assets/twemoji/${item.image}.svg`} alt="" className="mx-auto h-16 w-16" /><p className="mt-2 text-xs font-bold text-indigo-900">{index + 1}. {item.title}</p></div>)}</div>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <img src="/assets/kenney/space/star.png" alt="" className="mx-auto h-24 w-24" /><h2 className="mt-4 text-2xl font-extrabold">미니게임 축제 완료!</h2><p className="mt-2 text-slate-600">세 가지 미션 중 {score}개 성공했어요.</p>
      <div className="my-5 flex flex-wrap justify-center gap-3">{results.map((success, index) => <span key={ROUNDS[index].title} className="rounded-2xl bg-indigo-50 p-3 text-sm font-bold">{ROUNDS[index].label} {success ? '★ 성공' : '다음에 또 도전'}</span>)}</div>
      <button className="adventure-primary" onClick={reset}>다시 도전하기</button>
      <RewardCelebration type="game_complete" stars={calculateStars(score)} newStickers={earnedStickers} open={showReward} onDismiss={() => setShowReward(false)} message="끝까지 도전한 네가 챔피언!" />
    </section> : <section className="festival-cabinet">
      <div className="festival-marquee"><span>MINI GAME FESTIVAL</span><span>{session.round + 1} / 3</span></div>
      <div className="festival-screen">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-indigo-200"><span>미션 {session.round + 1} · {round.label}</span><span aria-label="남은 시간">{Math.ceil(session.remaining)}초</span></div>
        <h2 className="mt-3 text-center text-xl font-extrabold text-white sm:text-2xl">{round.title}</h2>
        {session.phase === 'briefing' ? <div className="flex min-h-60 flex-col items-center justify-center gap-5"><img src={`/assets/twemoji/${round.image}.svg`} alt="" className="h-24 w-24" /><p className="text-center text-sm text-indigo-100">{round.instruction}</p><button className="festival-start" onClick={() => dispatch({ type: 'begin' })}>준비됐어요!</button></div>
        : session.phase === 'round-result' ? <div className="flex min-h-60 flex-col items-center justify-center gap-4"><span className="text-6xl">{won ? '🌟' : '🌈'}</span><h3 className="text-2xl font-extrabold text-white">{won ? '미션 성공!' : '좋은 도전이었어요!'}</h3><p className="text-sm text-indigo-100">{session.hits} / {session.target} · 최고 {session.bestCombo} 콤보</p><button className="festival-start" onClick={() => { setPaused(false); dispatch({ type: 'round', state: newRound(session.round + 1, difficulty) }); }}>다음 미니게임</button></div>
        : <>
          <p className="mt-2 text-center text-sm text-indigo-100">{round.instruction}</p>
          <div className="relative flex min-h-52 flex-col items-center justify-center gap-3">
            {session.round === 0 && <motion.div key={session.hits} initial={reducedMotion ? false : { scale: 0.6 }} animate={{ scale: 1 }} className="festival-balloon" style={{ background: BUTTONS[session.sequence[session.hits]].color }}><span>{BUTTONS[session.sequence[session.hits]].shape}</span><span className="text-sm">{BUTTONS[session.sequence[session.hits]].name}</span></motion.div>}
            {session.round === 1 && <motion.img src="/assets/twemoji/rocket.svg" alt="충전 중인 로켓" className="h-28 w-28" animate={{ y: reducedMotion ? 0 : -session.hits * 2, rotate: reducedMotion ? 0 : session.hits % 2 ? 6 : -6 }} />}
            {session.round === 2 && <div className="flex max-w-sm flex-wrap justify-center gap-2" role="group" aria-label="무지개 암호 순서">{session.sequence.map((color, index) => <span key={index} aria-label={`${index + 1}번 ${BUTTONS[color].name}${index < session.hits ? ' 완료' : ''}`} aria-current={index === session.hits ? 'step' : undefined} className={`festival-note ${index < session.hits ? 'opacity-30' : ''} ${index === session.hits ? 'ring-4 ring-white' : ''}`} style={{ background: BUTTONS[color].color }}>{index < session.hits ? '✓' : BUTTONS[color].shape}<small>{BUTTONS[color].name}</small></span>)}</div>}
            <span className="text-sm font-extrabold text-amber-300">{session.hits} / {session.target} · {session.combo} 콤보</span>
            {paused && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#182044]/95"><p className="font-bold text-white">잠깐 쉬는 중</p><button className="festival-start" onClick={() => setPaused(false)}>이어서 하기</button></div>}
          </div>
          <progress className="h-3 w-full accent-amber-300" value={session.hits} max={session.target} aria-label="미션 진행" />
          <div className="mt-3 flex items-center justify-between gap-2"><p className="text-xs font-bold text-indigo-100" role="status">{session.feedback || '준비, 시작!'}</p><button className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white" onClick={() => setPaused(!paused)}>{paused ? '계속하기' : '잠깐 쉬기'}</button></div>
        </>}
      </div>
      <div className="festival-controls" role="group" aria-label="미니게임 버튼">{BUTTONS.map((button, index) => <button key={button.key} className="festival-button" style={{ backgroundColor: button.color }} aria-label={`${button.name} 버튼`} disabled={session.phase !== 'playing' || paused} onClick={() => press(index)}><span className="text-3xl">{button.shape}</span><span>{button.name}</span><kbd>{button.key.toUpperCase()}</kbd></button>)}</div>
      <p className="pb-4 text-center text-xs font-bold text-indigo-200">화면을 톡! 또는 키보드 A · S · D</p>
    </section>}
  </AdventureFrame>;
}
