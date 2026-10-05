import { useEffect, useRef, useState } from 'react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import ShapeFigure from '@/components/games/ShapeFigure';
import SpeakButton from '@/components/ui/SpeakButton';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { getGameConfig } from '@/data/game-configs';
import { SHAPES_DATA, type ShapeItem } from '@/data/shapes';
import { shuffled, type PictureId } from '@/data/picture-content';
import { voiceId } from '@/data/voice-lines';
import { cn } from '@/lib/cn';

/**
 * Three ways of meeting the same eight shapes: by name, inside everyday
 * things, and as pieces of a picture. Rounds cycle through the modes so one
 * run always touches all three.
 */
type Mode = 'pick' | 'everyday' | 'build';
const MODES: Mode[] = ['pick', 'everyday', 'build'];
interface PickOption { shape: ShapeItem; rotate: number; color: string }
interface EverydayOption { picture: PictureId; name: string; shape: ShapeItem }
/** A piece of a picture: the bounding box (in % of the board) the shape must fill. */
interface Slot { slug: string; x: number; y: number; w: number; h: number; rotate?: number }
interface Template { id: string; name: string; slots: Slot[]; extra: Slot[] }
type Round =
  | { kind: 'pick'; target: ShapeItem; options: PickOption[] }
  | { kind: 'everyday'; target: ShapeItem; options: EverydayOption[] }
  | { kind: 'build'; template: Template; slots: Slot[]; palette: ShapeItem[] };

const TEMPLATES: Template[] = [
  { id: 'house', name: '집', slots: [
    { slug: 'triangle', x: 10, y: 8, w: 80, h: 36 }, { slug: 'square', x: 22, y: 44, w: 56, h: 50 },
  ], extra: [{ slug: 'rectangle', x: 42, y: 66, w: 16, h: 28 }, { slug: 'circle', x: 28, y: 50, w: 12, h: 12 }] },
  { id: 'ice-cream', name: '아이스크림', slots: [
    { slug: 'triangle', x: 30, y: 50, w: 40, h: 44, rotate: 180 }, { slug: 'circle', x: 27, y: 6, w: 46, h: 46 },
  ], extra: [{ slug: 'star', x: 64, y: 4, w: 16, h: 16 }, { slug: 'heart', x: 20, y: 4, w: 16, h: 16 }] },
  { id: 'rocket', name: '로켓', slots: [
    { slug: 'rectangle', x: 32, y: 28, w: 36, h: 48 }, { slug: 'triangle', x: 32, y: 4, w: 36, h: 24 },
    { slug: 'circle', x: 42, y: 36, w: 16, h: 16 }, { slug: 'circle', x: 42, y: 56, w: 16, h: 16 },
  ], extra: [{ slug: 'triangle', x: 16, y: 56, w: 16, h: 22 }, { slug: 'triangle', x: 68, y: 56, w: 16, h: 22 }] },
  { id: 'train', name: '기차', slots: [
    { slug: 'rectangle', x: 6, y: 36, w: 56, h: 30 }, { slug: 'square', x: 64, y: 22, w: 30, h: 44 },
    { slug: 'circle', x: 12, y: 66, w: 20, h: 20 }, { slug: 'circle', x: 40, y: 66, w: 20, h: 20 },
  ], extra: [{ slug: 'circle', x: 70, y: 66, w: 20, h: 20 }, { slug: 'rectangle', x: 16, y: 18, w: 12, h: 18 }] },
];
/** Recolouring on the hardest level so the answer has to come from the outline, not the colour. */
const PAINTS = ['#FF6B6B', '#FFB84D', '#4ECDC4', '#54A0FF', '#FECA57', '#FF7EB3', '#A29BFE', '#55E6C1'];
/** Turns a square into a diamond and a heart upside down, so those stay upright. */
const ROTATIONS: Record<string, number[]> = { heart: [0], square: [0], diamond: [0], default: [0, 90, 180] };

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}
const bySlug = (slug: string) => SHAPES_DATA.find((shape) => shape.slug === slug)!;
/** 을/를 and 과/와 depend on whether the noun ends in a final consonant. */
const hasFinal = (word: string) => (word.charCodeAt(word.length - 1) - 0xac00) % 28 !== 0;
const obj = (word: string) => `${word}${hasFinal(word) ? '을' : '를'}`;
const withP = (word: string) => `${word}${hasFinal(word) ? '과' : '와'}`;

function buildPick(difficulty: Difficulty): Round {
  const count = difficulty === 'easy' ? 3 : 4;
  const [target, ...rest] = shuffled(SHAPES_DATA);
  const options = shuffled([target, ...rest.slice(0, count - 1)]).map((shape) => ({
    shape,
    rotate: difficulty === 'hard' ? pickOne(ROTATIONS[shape.slug] ?? ROTATIONS.default) : 0,
    color: difficulty === 'hard' ? pickOne(PAINTS) : shape.color,
  }));
  return { kind: 'pick', target, options };
}
function buildEveryday(difficulty: Difficulty): Round {
  const count = difficulty === 'easy' ? 3 : 4;
  const [target, ...rest] = shuffled(SHAPES_DATA);
  const correct = pickOne(target.everyday);
  const distractors = shuffled(rest.flatMap((shape) => shape.everyday.map((item) => ({ ...item, shape }))))
    .filter((item, position, all) => all.findIndex((other) => other.picture === item.picture) === position)
    .slice(0, count - 1);
  return { kind: 'everyday', target, options: shuffled([{ ...correct, shape: target }, ...distractors]) };
}
function buildBuild(difficulty: Difficulty, template: Template): Round {
  const slots = difficulty === 'hard' ? [...template.slots, ...template.extra] : template.slots;
  const needed = [...new Set(slots.map((slot) => slot.slug))];
  const spare = shuffled(SHAPES_DATA.filter((shape) => !needed.includes(shape.slug)));
  const paletteSize = Math.max(4, needed.length + 1);
  const palette = shuffled([...needed.map(bySlug), ...spare.slice(0, paletteSize - needed.length)]);
  return { kind: 'build', template, slots, palette };
}
function buildRounds(count: number, difficulty: Difficulty): Round[] {
  const templates = shuffled(TEMPLATES);
  let built = 0;
  return Array.from({ length: count }, (_, index) => {
    const mode = MODES[index % MODES.length];
    if (mode === 'pick') return buildPick(difficulty);
    if (mode === 'everyday') return buildEveryday(difficulty);
    return buildBuild(difficulty, templates[built++ % templates.length]);
  });
}

export default function ShapeExplorerGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [filled, setFilled] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const game = useGameLogic({ gameId: 'shape-explorer', category: 'shapes' });
  const { play } = useSound();
  const config = getGameConfig('shape-explorer')!;
  const questionCount = config.difficulties[difficulty].questionCount ?? 6;
  const round = rounds[index];
  const total = rounds.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current); }, []);

  function start() {
    const next = buildRounds(questionCount, difficulty);
    setRounds(next); setIndex(0); setFilled(0); setHadError(false); setWrongKey(null); setShowReward(true);
    setMessage('');
    game.start(next.length);
  }

  function nextRound() {
    if (index + 1 === total) { game.finish(); return; }
    play('confetti');
    setIndex(index + 1); setFilled(0); setHadError(false);
  }

  function miss(key: string, text: string) {
    setHadError(true); game.wrongAnswer();
    setWrongKey(key);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setWrongKey(null), 450);
    setMessage(text);
  }

  function choose(correct: boolean, key: string, wrongText: string, rightText: string) {
    if (game.state !== 'playing') return;
    if (!correct) { miss(key, wrongText); return; }
    if (!hadError) game.addScore();
    play('correct');
    setMessage(rightText);
    nextRound();
  }

  function place(shape: ShapeItem) {
    if (game.state !== 'playing' || round?.kind !== 'build') return;
    const slot = round.slots[filled];
    if (!slot) return;
    if (shape.slug !== slot.slug) {
      miss(shape.slug, `${shape.name} 조각은 여기에 맞지 않아요. 점선 모양을 다시 봐요.`);
      return;
    }
    play('drag_drop');
    const nextFilled = filled + 1;
    setFilled(nextFilled);
    if (nextFilled < round.slots.length) { setMessage(`${shape.name} 조각을 붙였어요!`); return; }
    if (!hadError) game.addScore();
    play('correct');
    setMessage(`${round.template.name} 완성! 도형 조각 ${round.slots.length}개로 만들었어요.`);
    nextRound();
  }

  const optionClass = (key: string) => cn('shape-option', wrongKey === key && 'shape-option-wrong');

  return <AdventureFrame title="도형 탐험대" subtitle="동그라미, 세모, 네모… 모양을 찾고 그림도 만들어요.">
    {game.state === 'ready' ? <AdventureIntro picture="kite" title="도형 탐험을 떠나요!" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start} instructions={config.rules}>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{questionCount}번의 탐험 · 도형 8가지 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <div className="flex justify-center gap-2">{SHAPES_DATA.slice(0, 4).map((shape) => <ShapeFigure key={shape.id} shape={shape} size={48} className="animate-float" />)}</div>
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">도형 탐험을 모두 마쳤어요!</h2>
      <p className="mt-3 text-slate-600">{total}번의 탐험 가운데 {game.score}번을 한 번에 해냈어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="도형 박사가 되었어요!" />
    </section> : round ? <section className="shape-stage">
      <RoundProgress round={index + 1} total={total} />

      {round.kind === 'pick' && <>
        <div className="shape-question">
          <h2>{obj(round.target.name)} 찾아요!</h2>
          <SpeakButton clip={voiceId.shape('ko', round.target.slug)} label={`${round.target.name} 듣기`} size="sm" />
        </div>
        <div className="shape-options" data-count={round.options.length} role="group" aria-label="도형 고르기">
          {round.options.map((option) => {
            const correct = option.shape.slug === round.target.slug;
            return <button key={option.shape.slug} className={optionClass(option.shape.slug)} data-correct={correct ? 'true' : undefined}
              aria-label={option.shape.name}
              onClick={() => choose(correct, option.shape.slug, `그건 ${option.shape.name}예요. ${obj(round.target.name)} 다시 찾아봐요.`, `맞아요, ${round.target.name}예요!`)}>
              <ShapeFigure shape={option.shape} size={64} color={option.color} rotate={option.rotate} />
              {difficulty === 'easy' && <span className="text-sm">{option.shape.name}</span>}
            </button>;
          })}
        </div>
      </>}

      {round.kind === 'everyday' && <>
        <div className="shape-question">
          <ShapeFigure shape={round.target} size={56} />
          <h2>{withP(round.target.name)} 닮은 물건은?</h2>
        </div>
        <div className="shape-options" data-count={round.options.length} role="group" aria-label="물건 고르기">
          {round.options.map((option) => {
            const correct = option.shape.slug === round.target.slug;
            return <button key={option.picture} className={optionClass(option.picture)} data-correct={correct ? 'true' : undefined}
              aria-label={option.name}
              onClick={() => choose(correct, option.picture, `${option.name}은(는) ${option.shape.name} 모양이에요. ${obj(round.target.name)} 찾아봐요.`, `${option.name}은(는) ${round.target.name} 모양이에요!`)}>
              <Picture id={option.picture} className="h-16 w-16" />
              <span className="text-sm">{option.name}</span>
            </button>;
          })}
        </div>
      </>}

      {round.kind === 'build' && <>
        <div className="shape-question">
          <h2>도형 조각으로 {obj(round.template.name)} 만들어요!</h2>
        </div>
        <div className="shape-build">
          <div className="shape-board" role="img" aria-label={`${round.template.name} 그림, 조각 ${filled}/${round.slots.length}`}>
            {round.slots.map((slot, position) => {
              const shape = bySlug(slot.slug);
              const state = position < filled ? 'filled' : position === filled ? 'active' : 'waiting';
              return <div key={`${slot.slug}-${position}`} className={cn('shape-slot', state === 'active' && 'shape-slot-active', state === 'filled' && 'shape-slot-filled')}
                style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%`, zIndex: position }}
                data-slot-state={state}>
                <ShapeFigure shape={shape} stretch rotate={slot.rotate} ghost={state !== 'filled'} />
              </div>;
            })}
          </div>
          <div className="shape-palette" role="group" aria-label="도형 조각">
            {round.palette.map((shape) => {
              const correct = round.slots[filled]?.slug === shape.slug;
              return <button key={shape.slug} className={optionClass(shape.slug)} data-correct={correct ? 'true' : undefined}
                aria-label={`${shape.name} 조각`} onClick={() => place(shape)}>
                <ShapeFigure shape={shape} size={44} />
                <span className="text-xs">{shape.name}</span>
              </button>;
            })}
          </div>
        </div>
      </>}

      <p className="shape-feedback" role="status">{message}</p>
    </section> : null}
  </AdventureFrame>;
}
