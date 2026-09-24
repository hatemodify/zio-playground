import { useState } from 'react';
import { motion } from 'motion/react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { shuffled, type PictureId } from '@/data/picture-content';

/**
 * Two counting activities in one shop, after Moose Math: fruit goes into the
 * blender one piece at a time (the concrete model) before the child names the
 * total (the abstract step), and the bingo board turns the same sums into a
 * board game. `max` caps every number a level can produce.
 */
const LEVELS = {
  easy: { max: 10, juiceRounds: 5, bingoRounds: 5 },
  normal: { max: 15, juiceRounds: 6, bingoRounds: 7 },
  hard: { max: 20, juiceRounds: 7, bingoRounds: 9 },
};
const FRUITS: { id: PictureId; label: string }[] = [
  { id: 'strawberry', label: '딸기' },
  { id: 'apple', label: '사과' },
  { id: 'banana', label: '바나나' },
  { id: 'orange', label: '오렌지' },
  { id: 'grapes', label: '포도' },
];
const PETS: PictureId[] = ['dog', 'rabbit', 'duck', 'penguin', 'panda', 'owl', 'bear', 'pig', 'cow'];
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

type Mode = 'juice' | 'bingo';
type Op = '+' | '-';
interface JuiceRound { fruit: { id: PictureId; label: string }; op: Op; start: number; delta: number; total: number; options: number[] }
interface BingoProblem { a: number; b: number; op: Op; answer: number; tile: number }
interface BingoBoard { values: number[]; problems: BingoProblem[] }

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
/** The answer plus two near misses, so the total has to be worked out rather than spotted. */
function optionsFor(answer: number, max: number): number[] {
  const options = new Set([answer]);
  while (options.size < 3) {
    const candidate = answer + randomInt(1, 3) * (Math.random() < 0.5 ? -1 : 1);
    if (candidate >= 0 && candidate <= max) options.add(candidate);
  }
  return shuffled([...options]);
}
/** Rounds alternate adding and taking away so both operations get practised every run. */
function buildJuice(count: number, max: number): JuiceRound[] {
  return Array.from({ length: count }, (_, index) => {
    const fruit = FRUITS[randomInt(0, FRUITS.length - 1)];
    if (index % 2 === 0) {
      const total = randomInt(3, max);
      const start = randomInt(1, total - 1);
      return { fruit, op: '+' as const, start, delta: total - start, total, options: optionsFor(total, max) };
    }
    const start = randomInt(3, max);
    const delta = randomInt(1, start - 1);
    return { fruit, op: '-' as const, start, delta, total: start - delta, options: optionsFor(start - delta, max) };
  });
}
function problemFor(answer: number, max: number, tile: number): BingoProblem {
  // Subtraction needs room above the answer; the largest tile can only be reached by adding.
  if (answer < max && Math.random() < 0.5) {
    const a = randomInt(answer + 1, max);
    return { a, b: a - answer, op: '-', answer, tile };
  }
  const a = randomInt(1, answer - 1);
  return { a, b: answer - a, op: '+', answer, tile };
}
/**
 * Board values never repeat, and the three tiles of one randomly chosen line are
 * asked last — so the final problem of every run completes a bingo.
 */
function buildBingo(rounds: number, max: number): BingoBoard {
  const values = shuffled(Array.from({ length: max - 1 }, (_, index) => index + 2)).slice(0, 9);
  const line = LINES[randomInt(0, LINES.length - 1)];
  const rest = shuffled(TILES.filter((tile) => !line.includes(tile))).slice(0, rounds - line.length);
  const order = [...rest, ...shuffled(line)];
  return { values, problems: order.map((tile) => problemFor(values[tile], max, tile)) };
}

export default function JuiceMathGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<Mode>('juice');
  const [rounds, setRounds] = useState<JuiceRound[]>([]);
  const [board, setBoard] = useState<BingoBoard>({ values: [], problems: [] });
  const [marks, setMarks] = useState<boolean[]>([]);
  const [index, setIndex] = useState(0);
  const [cup, setCup] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [bingo, setBingo] = useState<number[] | null>(null);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const game = useGameLogic({ gameId: 'juice-math', category: 'numbers' });
  const { play } = useSound();
  const level = LEVELS[difficulty];
  const juice = mode === 'juice';
  const round = rounds[index];
  const problem = board.problems[index];
  const total = juice ? rounds.length : board.problems.length;
  const finished = game.state === 'success' || game.state === 'reward';
  // The child pours first and answers second; the options only open once the cup is right.
  const poured = !!round && cup === round.total;
  // Hardest level closes the lid for the answer, so the total has to be held in mind.
  const blending = poured && difficulty === 'hard';

  function start() {
    const nextRounds = juice ? buildJuice(level.juiceRounds, level.max) : [];
    const nextBoard = juice ? { values: [], problems: [] } : buildBingo(level.bingoRounds, level.max);
    setRounds(nextRounds); setBoard(nextBoard); setMarks(TILES.map(() => false));
    setIndex(0); setCup(nextRounds[0]?.start ?? 0); setHadError(false); setBingo(null); setShowReward(true);
    setMessage(juice ? '주문서를 보고 과일을 넣거나 덜어 주세요.' : '식을 풀고 답이 적힌 칸을 눌러요.');
    game.start(juice ? nextRounds.length : nextBoard.problems.length);
  }

  function nextRound() {
    if (index + 1 === total) { game.finish(); return; }
    play('confetti');
    setIndex(index + 1);
    setCup(juice ? rounds[index + 1].start : 0);
    setHadError(false);
  }

  function pour(step: 1 | -1) {
    if (game.state !== 'playing' || !round || poured) return;
    const next = cup + step;
    if (next < 0 || next > level.max + 3) return;
    play(step === 1 ? 'drag_drop' : 'button_click');
    setCup(next);
    setMessage('');
  }

  function answerTotal(value: number) {
    if (game.state !== 'playing' || !round || !poured) return;
    if (value !== round.total) {
      setHadError(true); game.wrongAnswer();
      setMessage(`${value}개는 아니에요. 믹서 안의 과일을 하나씩 세어 볼까요?`);
      return;
    }
    if (!hadError) game.addScore();
    setMessage(`${round.start} ${round.op === '+' ? '+' : '−'} ${round.delta} = ${round.total}! 맛있는 주스 완성이에요.`);
    nextRound();
  }

  function markTile(tile: number) {
    if (game.state !== 'playing' || !problem || marks[tile]) return;
    if (board.values[tile] !== problem.answer) {
      setHadError(true); game.wrongAnswer();
      setMessage(`${board.values[tile]}은(는) 아니에요. ${problem.a} ${problem.op === '+' ? '+' : '−'} ${problem.b}를 다시 세어 봐요.`);
      return;
    }
    const nextMarks = marks.map((marked, position) => marked || position === tile);
    setMarks(nextMarks);
    if (!hadError) game.addScore();
    const line = LINES.find((candidate) => candidate.every((position) => nextMarks[position]));
    if (line && !bingo) { setBingo(line); play('star_earned'); }
    setMessage(line && !bingo ? '빙고! 세 칸이 한 줄로 이어졌어요.' : `${problem.a} ${problem.op === '+' ? '+' : '−'} ${problem.b} = ${problem.answer}! 동물 친구가 앉았어요.`);
    nextRound();
  }

  /** The board doubles as the result: the winning line is only worth showing once it is complete. */
  const bingoBoard = (interactive: boolean) => <div className="juice-bingo" role={interactive ? 'group' : undefined} aria-label={interactive ? '빙고판' : undefined}>
    {board.values.map((value, tile) => {
      const inBingo = !!bingo?.includes(tile);
      const className = `juice-tile ${marks[tile] ? 'juice-tile-marked' : ''} ${inBingo ? 'juice-tile-bingo' : ''}`;
      const content = marks[tile] ? <Picture id={PETS[tile]} label={interactive ? '' : `${value}에 앉은 동물 친구`} className="h-10 w-10" /> : <span>{value}</span>;
      if (!interactive) return <div key={tile} className={className}>{content}</div>;
      return <button key={tile} className={className} onClick={() => markTile(tile)} disabled={marks[tile]}
        aria-label={`${value}${marks[tile] ? ', 동물 친구가 앉았어요' : ''}`} aria-pressed={marks[tile]}>{content}</button>;
    })}
  </div>;

  return <AdventureFrame title="또리의 주스 가게" subtitle="과일을 넣고 덜어 보며 덧셈과 뺄셈을 익혀요.">
    {game.state === 'ready' ? <AdventureIntro picture="strawberry" title="어서 오세요, 숫자 주스 가게예요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={juice
        ? ['주문서를 보고 과일을 하나씩 넣거나 덜어요.', '믹서 안의 과일을 세어 모두 몇 개인지 골라요.', '더하기와 빼기 주문이 번갈아 나와요.']
        : ['식을 풀고 답이 적힌 칸을 눌러요.', '맞히면 동물 친구가 그 칸에 앉아요.', '세 칸이 한 줄로 이어지면 빙고!']}>
      <div className="mt-5 flex gap-2" role="group" aria-label="놀이 고르기">
        <button className="adventure-secondary flex-1" aria-pressed={juice} onClick={() => setMode('juice')}>주스 만들기</button>
        <button className="adventure-secondary flex-1" aria-pressed={!juice} onClick={() => setMode('bingo')}>동물 친구 빙고</button>
      </div>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{juice ? `${level.juiceRounds}잔 주문` : `${level.bingoRounds}문제 빙고`} · {level.max}까지의 수 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      {juice ? <Picture id="strawberry" className="mx-auto h-24 w-24 animate-float" /> : bingoBoard(false)}
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">{juice ? '주문을 모두 완성했어요!' : '빙고까지 완성했어요!'}</h2>
      <p className="mt-3 text-slate-600">{total}개의 식 가운데 {game.score}개를 한 번에 맞혔어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message={juice ? '더하기와 빼기로 주스를 만들었어요!' : '식을 풀어 빙고를 완성했어요!'} />
    </section> : <section className="juice-shop">
      <div className="juice-awning" aria-hidden="true" />
      <div className="px-4 pt-3"><RoundProgress round={index + 1} total={total} /></div>

      {juice && round ? <>
        <section className="juice-ticket" aria-label="주문서">
          <p className="text-xs font-bold tracking-wider text-teal-700">ORDER {String(index + 1).padStart(2, '0')}</p>
          <p className="mt-1 text-sm font-bold text-slate-700">믹서에 {round.fruit.label} {round.start}개가 들어 있어요. {round.delta}개를 {round.op === '+' ? '더 넣어' : '덜어'} 주세요!</p>
          <p className="juice-equation" role="math" aria-label={`${round.start} ${round.op === '+' ? '더하기' : '빼기'} ${round.delta}는 얼마일까요?`}>
            <span>{round.start}</span><em>{round.op === '+' ? '+' : '−'}</em><span>{round.delta}</span><em>=</em><strong>?</strong>
          </p>
        </section>

        <div className="juice-blender" aria-label={`믹서에 담긴 ${round.fruit.label}`} aria-live="polite">
          {blending ? <p className="juice-blending">윙~ 갈고 있어요!</p>
            : <div className="juice-fruits" role="list">{Array.from({ length: cup }, (_, position) => <motion.span key={position} role="listitem" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
              <Picture id={round.fruit.id} label={`${round.fruit.label} ${position + 1}개째`} className="h-10 w-10" />
            </motion.span>)}</div>}
          {difficulty === 'easy' && !blending && <p className="juice-count">지금 {cup}개</p>}
        </div>

        {poured ? <div className="juice-controls">
          <p className="juice-prompt">모두 몇 개가 되었을까요?</p>
          <div className="juice-options" role="group" aria-label="답 고르기">{round.options.map((option) => <button key={option} className="juice-option" onClick={() => answerTotal(option)} aria-label={`답 ${option}`}>{option}</button>)}</div>
        </div> : <div className="juice-controls">
          <div className="juice-pour" role="group" aria-label="과일 넣고 덜기">
            <button className="juice-pour-button" onClick={() => pour(1)} aria-label={`${round.fruit.label} 넣기`}><Picture id={round.fruit.id} className="h-8 w-8" />{round.fruit.label} 넣기</button>
            <button className="juice-pour-button" onClick={() => pour(-1)} disabled={cup === 0} aria-label={`${round.fruit.label} 덜어내기`}><span aria-hidden="true" className="text-2xl">➖</span>덜어내기</button>
          </div>
          <p className="juice-prompt">{round.op === '+' ? `${round.delta}개를 더 넣으면 답을 고를 수 있어요.` : `${round.delta}개를 덜어내면 답을 고를 수 있어요.`}</p>
        </div>}
      </> : problem ? <>
        <section className="juice-ticket" aria-label="문제">
          <p className="text-xs font-bold tracking-wider text-teal-700">QUIZ {String(index + 1).padStart(2, '0')}</p>
          <p className="juice-equation" role="math" aria-label={`${problem.a} ${problem.op === '+' ? '더하기' : '빼기'} ${problem.b}는 얼마일까요?`}>
            <span>{problem.a}</span><em>{problem.op === '+' ? '+' : '−'}</em><span>{problem.b}</span><em>=</em><strong>?</strong>
          </p>
        </section>
        {bingoBoard(true)}
      </> : null}

      <p className="juice-feedback" role="status">{message}</p>
    </section>}
  </AdventureFrame>;
}
