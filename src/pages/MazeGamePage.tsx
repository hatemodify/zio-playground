import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { getGameConfig } from '@/data/game-configs';
import { picturePath } from '@/data/picture-content';

/**
 * A finger-drawn maze: the rabbit follows the child's finger from the top-left
 * corner to the carrot, and walls simply refuse to let it through. Every maze
 * is a fresh perfect maze (one route, no loops), three per run.
 */
const MAZES_PER_RUN = 3;
const CELL = 10;
const PAD = 1;
const WALL = { N: 1, E: 2, S: 4, W: 8 } as const;
const DIRS = [
  { bit: WALL.N, opposite: WALL.S, dr: -1, dc: 0 },
  { bit: WALL.E, opposite: WALL.W, dr: 0, dc: 1 },
  { bit: WALL.S, opposite: WALL.N, dr: 1, dc: 0 },
  { bit: WALL.W, opposite: WALL.E, dr: 0, dc: -1 },
];

interface Maze { size: number; walls: number[]; solution: number[] }

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}
function neighbourOf(size: number, cell: number, dir: (typeof DIRS)[number]): number | null {
  const r = Math.floor(cell / size) + dir.dr;
  const c = (cell % size) + dir.dc;
  return r < 0 || c < 0 || r >= size || c >= size ? null : r * size + c;
}
/** Shortest route from the first cell to the last, as cell indices. */
function solve(size: number, walls: number[]): number[] {
  const goal = size * size - 1;
  const parent = new Array<number>(size * size).fill(-1);
  const queue = [0];
  parent[0] = 0;
  while (queue.length) {
    const cell = queue.shift()!;
    if (cell === goal) break;
    for (const dir of DIRS) {
      const next = neighbourOf(size, cell, dir);
      if (next === null || walls[cell] & dir.bit || parent[next] !== -1) continue;
      parent[next] = cell;
      queue.push(next);
    }
  }
  const route = [goal];
  while (route[0] !== 0) route.unshift(parent[route[0]]);
  return route;
}
/** Recursive backtracker: every cell starts boxed in and the walk knocks walls down as it explores. */
function generateMaze(size: number): Maze {
  const walls = new Array<number>(size * size).fill(WALL.N | WALL.E | WALL.S | WALL.W);
  const visited = new Array<boolean>(size * size).fill(false);
  const stack = [0];
  visited[0] = true;
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const open = DIRS.map((dir) => ({ dir, next: neighbourOf(size, cell, dir) })).filter((c) => c.next !== null && !visited[c.next]);
    if (!open.length) { stack.pop(); continue; }
    const { dir, next } = open[randomInt(open.length)];
    walls[cell] &= ~dir.bit;
    walls[next!] &= ~dir.opposite;
    visited[next!] = true;
    stack.push(next!);
  }
  return { size, walls, solution: solve(size, walls) };
}
/** Whether the rabbit can step from one cell straight into the other. */
function canStep(maze: Maze, from: number, to: number): boolean {
  return DIRS.some((dir) => neighbourOf(maze.size, from, dir) === to && !(maze.walls[from] & dir.bit));
}
function centerOf(size: number, cell: number) {
  return { x: PAD + ((cell % size) + 0.5) * CELL, y: PAD + (Math.floor(cell / size) + 0.5) * CELL };
}

export default function MazeGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mazes, setMazes] = useState<Maze[]>([]);
  const [index, setIndex] = useState(0);
  const [path, setPath] = useState<number[]>([0]);
  const [solved, setSolved] = useState(false);
  const [bump, setBump] = useState(0);
  const [showReward, setShowReward] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<number[]>([0]);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const game = useGameLogic({ gameId: 'maze', category: 'play' });
  const { play } = useSound();
  const size = getGameConfig('maze')?.difficulties[difficulty].itemCount ?? 5;
  const maze = mazes[index];
  const finished = game.state === 'success' || game.state === 'reward';
  const view = size * CELL + PAD * 2;

  function start() {
    setMazes(Array.from({ length: MAZES_PER_RUN }, () => generateMaze(size)));
    setIndex(0); setSolved(false); setShowReward(true);
    pathRef.current = [0]; setPath([0]);
    game.start(MAZES_PER_RUN);
  }

  // A found carrot lingers for the bounce, then the next maze slides in.
  useEffect(() => {
    if (!solved) return;
    const timer = setTimeout(() => {
      if (index + 1 === MAZES_PER_RUN) { game.finish(); return; }
      play('confetti');
      setIndex(index + 1); setSolved(false);
      pathRef.current = [0]; setPath([0]);
    }, 1100);
    return () => clearTimeout(timer);
  }, [solved, index, game, play]);

  function commit() {
    setPath([...pathRef.current]);
    if (maze && pathRef.current[pathRef.current.length - 1] === maze.size * maze.size - 1) {
      setSolved(true);
      game.addScore();
    }
  }
  /** Moves the rabbit toward a cell: back along the drawn line, or one open step forward. Walls just bump. */
  function stepTo(cell: number): boolean {
    if (!maze || solved) return false;
    const current = pathRef.current[pathRef.current.length - 1];
    if (cell === current) return true;
    const seen = pathRef.current.indexOf(cell);
    if (seen !== -1) { pathRef.current = pathRef.current.slice(0, seen + 1); return true; }
    if (!canStep(maze, current, cell)) return false;
    pathRef.current = [...pathRef.current, cell];
    return true;
  }
  function cellAt(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * view;
    const y = ((event.clientY - rect.top) / rect.height) * view;
    return { x, y, cell: cellFor(x, y) };
  }
  function cellFor(x: number, y: number): number | null {
    const c = Math.floor((x - PAD) / CELL);
    const r = Math.floor((y - PAD) / CELL);
    return c < 0 || r < 0 || c >= size || r >= size ? null : r * size + c;
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (game.state !== 'playing' || solved) return;
    const { x, y, cell } = cellAt(event);
    if (cell === null) return;
    const current = pathRef.current[pathRef.current.length - 1];
    const adjacent = DIRS.some((dir) => neighbourOf(size, current, dir) === cell);
    if (cell !== current && !pathRef.current.includes(cell) && !canStep(maze, current, cell)) {
      if (adjacent) setBump((n) => n + 1);
      return;
    }
    stepTo(cell);
    commit();
    dragRef.current = { x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  // A quick swipe can skip whole cells, so the move is replayed as small steps along the finger's line.
  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragRef.current || solved) return;
    const { x, y } = cellAt(event);
    const from = dragRef.current;
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (CELL / 4)));
    let bumped = false;
    for (let i = 1; i <= steps; i++) {
      const cell = cellFor(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps);
      if (cell !== null && !stepTo(cell)) bumped = true;
      if (pathRef.current[pathRef.current.length - 1] === size * size - 1) break;
    }
    dragRef.current = { x, y };
    if (bumped) setBump((n) => n + 1);
    commit();
  }
  function onPointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function clearPath() {
    if (solved) return;
    play('button_click');
    pathRef.current = [0];
    setPath([0]);
  }

  const head = path[path.length - 1];
  const rabbit = maze ? centerOf(maze.size, head) : { x: 0, y: 0 };
  const goal = maze ? centerOf(maze.size, maze.size * maze.size - 1) : { x: 0, y: 0 };

  return <AdventureFrame title="미로 찾기" subtitle="손가락으로 길을 그려 토끼를 당근까지 데려다줘요.">
    {game.state === 'ready' ? <AdventureIntro picture="rabbit" title="토끼가 당근을 찾고 있어요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['토끼를 누르고 손가락을 떼지 않은 채 길을 따라가요.', '벽이 있는 곳은 지나갈 수 없어요. 다른 길을 찾아봐요.', '당근까지 도착하면 다음 미로로 넘어가요. 모두 세 개!']}>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{size}×{size} 미로 · {MAZES_PER_RUN}개 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <div className="flex items-center justify-center gap-3"><Picture id="rabbit" className="h-24 w-24 animate-float" /><Picture id="carrot" className="h-16 w-16" /></div>
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">미로를 모두 통과했어요!</h2>
      <p className="mt-3 text-slate-600">토끼가 당근을 {game.score}개 찾았어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="길을 잘 찾아 토끼를 집까지 데려다줬어요!" />
    </section> : maze ? <section className="maze-board">
      <RoundProgress round={index + 1} total={MAZES_PER_RUN} />
      <p className="maze-message" aria-live="polite">{solved ? '당근을 찾았어요! 🥕' : path.length > 1 ? '잘하고 있어요. 계속 그려 봐요!' : '토끼를 눌러 당근까지 길을 그려요.'}</p>
      <div className="maze-stage">
        <svg ref={svgRef} className={`maze-svg ${solved ? 'maze-svg-solved' : ''}`} viewBox={`0 0 ${view} ${view}`} role="img" aria-label={`${maze.size}×${maze.size} 미로`}
          data-maze data-size={maze.size} data-view={view} data-cell={CELL} data-pad={PAD} data-path-length={path.length} data-current={head} data-solved={solved}
          data-solution={JSON.stringify(maze.solution)} data-walls={JSON.stringify(maze.walls)}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <rect className="maze-cell-start" x={PAD} y={PAD} width={CELL} height={CELL} rx={1.5} />
          <rect className="maze-cell-goal" x={goal.x - CELL / 2} y={goal.y - CELL / 2} width={CELL} height={CELL} rx={1.5} />
          <polyline className="maze-path" points={path.map((cell) => { const p = centerOf(maze.size, cell); return `${p.x},${p.y}`; }).join(' ')} />
          <image href={picturePath('carrot')} data-role="carrot" x={goal.x - 3.4} y={goal.y - 3.4} width={6.8} height={6.8} />
          <g className="maze-walls">
            {maze.walls.map((wall, cell) => {
              const x = PAD + (cell % maze.size) * CELL;
              const y = PAD + Math.floor(cell / maze.size) * CELL;
              const lines: string[] = [];
              if (wall & WALL.N) lines.push(`M${x} ${y}h${CELL}`);
              if (wall & WALL.W) lines.push(`M${x} ${y}v${CELL}`);
              if (wall & WALL.S && Math.floor(cell / maze.size) === maze.size - 1) lines.push(`M${x} ${y + CELL}h${CELL}`);
              if (wall & WALL.E && cell % maze.size === maze.size - 1) lines.push(`M${x + CELL} ${y}v${CELL}`);
              return lines.length ? <path key={cell} className="maze-wall" d={lines.join(' ')} /> : null;
            })}
          </g>
          <g className={`maze-rabbit ${solved ? 'maze-rabbit-solved' : ''}`} style={{ transform: `translate(${rabbit.x}px, ${rabbit.y}px)` }}>
            <g key={bump} className={bump ? 'maze-rabbit-bump' : ''}>
              <circle className="maze-rabbit-ring" r={4.4} />
              <image href={picturePath('rabbit')} data-role="rabbit" x={-3.6} y={-3.6} width={7.2} height={7.2} />
            </g>
          </g>
        </svg>
      </div>
      <div className="maze-actions">
        <button className="adventure-secondary" onClick={clearPath} disabled={solved || path.length < 2}>다시 그리기</button>
      </div>
    </section> : null}
  </AdventureFrame>;
}
