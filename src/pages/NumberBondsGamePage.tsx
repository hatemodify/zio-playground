import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { getGameConfig } from '@/data/game-configs';
import { shuffled, type PictureId } from '@/data/picture-content';

/**
 * Part-whole thinking with two houses: a flock is split between them and the
 * child names the missing part (가르기), or both parts are given and the child
 * names the whole (모으기). The bond diagram above the houses holds the same
 * three numbers, so the picture and the abstraction are always side by side.
 */
const LEVELS: Record<Difficulty, number> = { easy: 5, normal: 7, hard: 10 };
const CONFIG = getGameConfig('number-bonds')!;
const REVEAL_MS = 1400;
const ANIMALS: { id: PictureId; label: string }[] = [
  { id: 'rabbit', label: '토끼' }, { id: 'dog', label: '강아지' }, { id: 'duck', label: '오리' },
  { id: 'penguin', label: '펭귄' }, { id: 'pig', label: '돼지' }, { id: 'bear', label: '곰' },
];

type Mode = 'split' | 'join';
interface Round { mode: Mode; animal: { id: PictureId; label: string }; total: number; left: number; right: number; options: number[] }

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
/** The answer plus near misses, so the parts have to be counted rather than guessed. */
function optionsFor(answer: number, min: number, max: number, count: number): number[] {
  const near = shuffled([answer + 1, answer - 1, answer + 2, answer - 2, answer + 3, answer - 3]);
  const options = new Set([answer]);
  for (const candidate of near) {
    if (options.size >= count) break;
    if (candidate >= min && candidate <= max) options.add(candidate);
  }
  while (options.size < count) options.add(randomInt(min, max));
  return shuffled([...options]);
}
/** Rounds alternate splitting and joining; only the hardest level lets one house stand empty. */
function buildRounds(count: number, max: number, allowEmpty: boolean, choices: number): Round[] {
  return Array.from({ length: count }, (_, index) => {
    const animal = ANIMALS[randomInt(0, ANIMALS.length - 1)];
    const total = randomInt(2, max);
    if (index % 2 === 0) {
      const left = allowEmpty ? randomInt(0, total) : randomInt(1, total - 1);
      return { mode: 'split' as const, animal, total, left, right: total - left, options: optionsFor(total - left, allowEmpty ? 0 : 1, max, choices) };
    }
    const left = randomInt(1, total - 1);
    return { mode: 'join' as const, animal, total, left, right: total - left, options: optionsFor(total, 2, max, choices) };
  });
}

type Slot = number | '?';
/** Whole on top, two parts below — the classic number bond. */
function BondDiagram({ whole, left, right, solved }: { whole: Slot; left: Slot; right: Slot; solved: boolean }) {
  const circle = (cx: number, cy: number, value: Slot, hole: boolean) => <g className={hole ? 'bonds-hole' : undefined}>
    <circle cx={cx} cy={cy} r={32} fill={hole ? '#fff7d6' : '#f3e8ff'} stroke={hole ? '#f0b94e' : '#8e6ac9'} strokeWidth={4} strokeDasharray={hole ? '8 6' : undefined} />
    <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={900} fill={hole ? '#b47a12' : '#5b3f8a'}>{value}</text>
  </g>;
  return <svg viewBox="0 0 320 156" className={`bonds-diagram ${solved ? 'bonds-diagram-solved' : ''}`} role="img" aria-label={`수 가르기 그림: 전체 ${whole}, 왼쪽 ${left}, 오른쪽 ${right}`}>
    <line x1={160} y1={44} x2={82} y2={116} stroke="#c4b0e0" strokeWidth={7} strokeLinecap="round" />
    <line x1={160} y1={44} x2={238} y2={116} stroke="#c4b0e0" strokeWidth={7} strokeLinecap="round" />
    {circle(160, 40, whole, whole === '?')}
    {circle(80, 118, left, left === '?')}
    {circle(240, 118, right, right === '?')}
  </svg>;
}

function House({ side, animal, count, label, closed }: { side: string; animal: { id: PictureId; label: string }; count: number; label: Slot; closed: boolean }) {
  return <div className="bonds-house" aria-label={`${side} 집: ${closed ? '문이 닫혀 있어요' : `${animal.label} ${count}마리`}`}>
    <div className="bonds-roof" aria-hidden="true"><span className="bonds-house-number">{label}</span></div>
    <div className="bonds-yard">
      {closed ? <Picture id="door" className="h-16 w-16" /> : Array.from({ length: count }, (_, position) => <motion.span key={position} className="bonds-animal"
        initial={{ y: -28, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: position * 0.07, type: 'spring', stiffness: 420, damping: 16 }}>
        <Picture id={animal.id} className="h-9 w-9" />
      </motion.span>)}
      {!closed && count === 0 && <span className="bonds-empty">비어 있어요</span>}
    </div>
  </div>;
}

export default function NumberBondsGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [shakes, setShakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'number-bonds', category: 'numbers' });
  const { finish } = game;
  const { play } = useSound();
  const max = LEVELS[difficulty];
  const questionCount = CONFIG.difficulties[difficulty].questionCount ?? 6;
  const round = rounds[index];
  const total = rounds.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const split = round?.mode === 'split';
  const answer = round ? (split ? round.right : round.total) : 0;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    setRounds(buildRounds(questionCount, max, difficulty === 'hard', difficulty === 'easy' ? 3 : 4));
    setIndex(0); setHadError(false); setShakes(0); setSolved(false); setShowReward(true);
    setMessage('두 집의 동물 친구를 세어 봐요.');
    game.start(questionCount);
  }

  function choose(value: number) {
    if (game.state !== 'playing' || !round || solved) return;
    if (value !== answer) {
      setHadError(true); setShakes((count) => count + 1); game.wrongAnswer();
      setMessage(split ? `${value}마리는 아니에요. ${round.total}마리에서 왼쪽 집 ${round.left}마리를 빼면 몇 마리일까요?` : `${value}마리는 아니에요. 두 집의 ${round.animal.label}를 이어서 세어 볼까요?`);
      return;
    }
    if (!hadError) game.addScore();
    else play('correct');
    setSolved(true);
    setMessage(split ? `${round.total}은 ${round.left}과 ${round.right}로 가를 수 있어요!` : `${round.left} + ${round.right} = ${round.total}! 모두 ${round.total}마리예요.`);
    // The completed bond stays on screen for a moment, then the next flock arrives.
    timer.current = setTimeout(() => {
      setSolved(false);
      if (index + 1 === total) { finish(); return; }
      play('confetti');
      setIndex(index + 1); setHadError(false); setShakes(0); setMessage('');
    }, REVEAL_MS);
  }

  return <AdventureFrame title="또리의 두 집 마을" subtitle="동물 친구를 두 집으로 가르고 모으며 수의 짝을 알아봐요.">
    {game.state === 'ready' ? <AdventureIntro picture="rabbit" title="동물 친구들이 두 집에 나눠 살아요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['가르기: 전체 수와 한 집의 수를 보고 다른 집의 수를 골라요.', '모으기: 두 집의 동물을 모두 세어 전체 수를 골라요.', '위의 그림에 세 수가 함께 적혀요.']}>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{questionCount}문제 · {max}까지의 수 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <Picture id="rabbit" className="mx-auto h-24 w-24 animate-float" />
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">동물 친구들이 모두 집을 찾았어요!</h2>
      <p className="mt-3 text-slate-600">{total}문제 가운데 {game.score}문제를 한 번에 맞혔어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="수를 가르고 모을 수 있게 됐어요!" />
    </section> : round ? <section className="bonds-village">
      <div className="px-4 pt-3"><RoundProgress round={index + 1} total={total} /></div>
      <p className="bonds-question">{split
        ? `${round.animal.label} ${round.total}마리가 두 집에 나눠 살아요. 오른쪽 집에는 몇 마리일까요?`
        : `왼쪽 집에 ${round.left}마리, 오른쪽 집에 ${round.right}마리. ${round.animal.label}는 모두 몇 마리일까요?`}</p>

      <div key={`${index}-${solved}`} className="bonds-scene">
        <BondDiagram whole={split || solved ? round.total : '?'} left={round.left} right={!split || solved ? round.right : '?'} solved={solved} />
        <div className="bonds-houses">
          <House side="왼쪽" animal={round.animal} count={round.left} label={round.left} closed={false} />
          <House side="오른쪽" animal={round.animal} count={round.right} label={!split || solved ? round.right : '?'} closed={split && difficulty === 'hard' && !solved} />
        </div>
      </div>

      {!solved && <div key={shakes} className={`bonds-controls ${shakes ? 'numbers-shake' : ''}`}>
        <p className="bonds-prompt">{split ? '오른쪽 집에 들어갈 수를 골라요.' : '모두 몇 마리인지 골라요.'}</p>
        <div className="bonds-options" role="group" aria-label="답 고르기">
          {round.options.map((option) => <button key={option} className="bonds-option" data-correct={option === answer} onClick={() => choose(option)} aria-label={`답 ${option}`}>{option}</button>)}
        </div>
      </div>}

      <p className="bonds-feedback" role="status">{message}</p>
    </section> : null}
  </AdventureFrame>;
}
