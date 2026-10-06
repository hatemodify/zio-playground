import { useEffect, useRef, useState } from 'react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import ClockFace from '@/components/games/ClockFace';
import Picture from '@/components/games/Picture';
import SpeakButton from '@/components/ui/SpeakButton';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { getGameConfig } from '@/data/game-configs';
import { voiceId } from '@/data/voice-lines';
import { shuffled } from '@/data/picture-content';
import { andParticle, digitalLabel, hourOf, makeTime, minuteHandNumber, minuteOf, normalizeTime, objectParticle, randomTime, timeLabel, timeReading, timeVoiceIds, topicParticle } from '@/data/clock';

/**
 * Telling the time on a clock whose hands the child turns by hand. Three ways
 * to play: set the hands to a spoken/written time, read a time off the dial,
 * or just spin the hands and hear what time it has become. Difficulty sets
 * how fine the minute hand snaps: whole hours, half hours, five minutes.
 */
const CONFIG = getGameConfig('clock')!;
const STEPS: Record<Difficulty, number> = { easy: 60, normal: 30, hard: 5 };
const STEP_LABELS: Record<Difficulty, string> = { easy: '정각만', normal: '정각과 30분', hard: '5분 단위' };
const REVEAL_MS = 1500;

type Mode = 'set' | 'read' | 'free';
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'set', label: '바늘 맞추기', hint: '말해 주는 시간으로 바늘을 돌려요' },
  { id: 'read', label: '시계 읽기', hint: '시계를 보고 몇 시인지 골라요' },
  { id: 'free', label: '마음껏 돌리기', hint: '바늘을 돌리면 시간을 읽어 줘요' },
];
interface Round { target: number; start: number; options: number[] }

/** The answer plus the usual slips: a neighbouring hour, the same hour with other minutes, the two hands swapped. */
function optionsFor(answer: number, step: number, count: number): number[] {
  const hour = hourOf(answer);
  const minute = minuteOf(answer);
  const near = [makeTime(hour + 1, minute), makeTime(hour - 1, minute), makeTime(hour + 2, minute), makeTime(hour - 2, minute)];
  if (step < 60) {
    const others = Array.from({ length: 60 / step }, (_, index) => index * step).filter((value) => value !== minute);
    near.push(...shuffled(others).slice(0, 2).map((value) => makeTime(hour, value)));
    const swapped = makeTime(minuteHandNumber(answer), (hour % 12) * 5);
    if (minuteOf(swapped) % step === 0) near.push(swapped);
  }
  const options = new Set([answer]);
  for (const candidate of shuffled(near)) {
    if (options.size >= count) break;
    if (candidate !== answer) options.add(candidate);
  }
  while (options.size < count) options.add(randomTime(step, answer));
  return shuffled([...options]);
}
function buildRounds(count: number, step: number, choices: number): Round[] {
  let previous: number | undefined;
  return Array.from({ length: count }, () => {
    const target = randomTime(step, previous);
    previous = target;
    return { target, start: randomTime(step, target), options: optionsFor(target, step, choices) };
  });
}

/** What the hands say right now — the readout that teaches, so it is spoken too. */
function TimeReadout({ time, big = false }: { time: number; big?: boolean }) {
  return <div className={big ? 'clock-readout clock-readout-big' : 'clock-readout'} aria-live="polite" data-readout={time}>
    <span className="clock-readout-label">{timeLabel(time)}</span>
    <span className="clock-readout-reading">{timeReading(time)}</span>
    <span className="clock-readout-digital" aria-hidden="true">{digitalLabel(time)}</span>
  </div>;
}

export default function ClockGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<Mode>('set');
  const [freeOpen, setFreeOpen] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [shakes, setShakes] = useState(0);
  const [reveal, setReveal] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'clock', category: 'numbers' });
  const { finish } = game;
  const { play } = useSound();
  const step = STEPS[difficulty];
  const hourOnly = difficulty === 'easy';
  const questionCount = CONFIG.difficulties[difficulty].questionCount ?? 6;
  const round = rounds[index];
  const total = rounds.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const playing = game.state === 'playing' && round !== undefined && reveal === null;
  // Hard mode hides the live readout so the child reads the hands themselves.
  const showReadout = difficulty !== 'hard';

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    if (mode === 'free') {
      setTime(makeTime(3, 0));
      setMessage('');
      setFreeOpen(true);
      return;
    }
    const next = buildRounds(questionCount, step, difficulty === 'easy' ? 3 : 4);
    setRounds(next);
    setIndex(0); setTime(next[0].start); setHadError(false); setShakes(0); setReveal(null); setShowReward(true);
    setMessage(mode === 'set' ? '짧은 바늘은 시, 긴 바늘은 분이에요.' : '짧은 바늘이 가리키는 수가 "시"예요.');
    game.start(questionCount);
  }

  function succeed() {
    if (!round) return;
    if (!hadError) game.addScore();
    else play('correct');
    setTime(round.target);
    setReveal(round.target);
    setMessage(`딩동! ${timeLabel(round.target)}, ${timeReading(round.target)}이에요.`);
    // The answer stays on the dial for a moment, then the next round comes on its own.
    timer.current = setTimeout(() => {
      setReveal(null);
      if (index + 1 === total) { finish(); return; }
      play('confetti');
      const nextRound = rounds[index + 1];
      setIndex(index + 1); setTime(nextRound.start); setHadError(false); setShakes(0); setMessage('');
    }, REVEAL_MS);
  }
  function fail(text: string) {
    setHadError(true); setShakes((count) => count + 1); game.wrongAnswer(); setMessage(text);
  }

  function check() {
    if (!playing || !round) return;
    if (time === round.target) return succeed();
    const hourWrong = hourOf(time) !== hourOf(round.target);
    const minuteWrong = minuteOf(time) !== minuteOf(round.target);
    const hour = hourOf(round.target);
    const dial = minuteHandNumber(round.target);
    const hints: string[] = [];
    if (hourWrong) hints.push(minuteOf(round.target) ? `짧은 바늘이 ${hour}${andParticle(hour)} ${(hour % 12) + 1} 사이를 가리켜야 해요` : `짧은 바늘이 ${hour}${objectParticle(hour)} 가리켜야 해요`);
    if (minuteWrong) hints.push(`긴 바늘이 ${dial}${objectParticle(dial)} 가리켜야 해요`);
    fail(`지금은 ${timeLabel(time)}이에요. ${hints.join(', ')}.`);
  }

  function answer(option: number) {
    if (!playing || !round) return;
    if (option !== round.target) return fail(`${timeLabel(option)}${topicParticle(timeLabel(option))} 아니에요. 짧은 바늘부터 다시 볼까요?`);
    succeed();
  }

  function nudge(minutes: number) {
    const next = normalizeTime(time + minutes);
    setTime(next);
    play('button_click');
  }

  function released() {
    play('drag_drop');
  }

  const nudges = <div className="clock-nudges" role="group" aria-label="바늘 돌리기">
    <button className="clock-nudge" onClick={() => nudge(-60)} aria-label="1시간 전">−1시간</button>
    <button className="clock-nudge" onClick={() => nudge(60)} aria-label="1시간 더">+1시간</button>
    {!hourOnly && <button className="clock-nudge" onClick={() => nudge(-step)} aria-label={`${step}분 전`}>−{step}분</button>}
    {!hourOnly && <button className="clock-nudge" onClick={() => nudge(step)} aria-label={`${step}분 더`}>+{step}분</button>}
  </div>;

  return <AdventureFrame title="똑딱똑딱 시계 나라" subtitle="바늘을 손으로 돌려 시간을 맞추고 읽어요.">
    {freeOpen ? <section className="clock-room">
      <div className="flex items-center justify-center gap-3"><p className="clock-prompt">바늘을 돌려 보세요. 어떤 시간이 될까요?</p><SpeakButton clip={voiceId.phrase('clock-free')} label="안내 듣기" /></div>
      <ClockFace time={time} step={step} interactive hourOnly={hourOnly} minuteRing={step <= 15} onChange={setTime} onRelease={released} />
      <div className="clock-readout-row">
        <TimeReadout time={time} big />
        <SpeakButton clip={timeVoiceIds(time)} label="시간 듣기" size="lg" />
      </div>
      {nudges}
      <button className="adventure-secondary clock-stop" onClick={() => setFreeOpen(false)}>그만하기</button>
    </section> : game.state === 'ready' ? <AdventureIntro picture="alarm-clock" title="시계 바늘을 돌려 볼까요?" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['짧은 바늘은 "시", 긴 바늘은 "분"을 가리켜요.', '바늘을 손가락으로 잡고 돌려 시간을 맞춰요.', '시계를 보고 몇 시인지 고를 수도 있어요.']}>
      <div className="clock-modes" role="group" aria-label="놀이 고르기">
        {MODES.map((item) => <button key={item.id} type="button" className={`adventure-secondary clock-mode ${mode === item.id ? 'border-teal-600 bg-teal-50 text-teal-800' : ''}`} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
          <span className="block text-sm font-extrabold">{item.label}</span><span className="hidden text-xs font-medium text-slate-500 sm:block">{item.hint}</span>
        </button>)}
      </div>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{mode === 'free' ? `${STEP_LABELS[difficulty]} · 원하는 만큼 돌려요` : `${questionCount}문제 · ${STEP_LABELS[difficulty]} · 시간 제한 없음`}</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <Picture id="alarm-clock" className="mx-auto h-24 w-24 animate-float" />
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">시계를 모두 맞혔어요!</h2>
      <p className="mt-3 text-slate-600">{total}문제 가운데 {game.score}문제를 한 번에 맞혔어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="시계를 읽을 수 있게 됐어요!" />
    </section> : round ? <section className="clock-room">
      <div className="pt-1"><RoundProgress round={index + 1} total={total} /></div>

      {reveal !== null ? <div className="clock-reveal">
        <ClockFace time={reveal} step={step} minuteRing={step <= 15} />
        <TimeReadout time={reveal} big />
      </div> : mode === 'set' ? <div key={shakes} className={shakes ? 'numbers-shake' : undefined}>
        <div className="clock-target" data-target={round.target}>
          <span className="clock-target-caption">이 시간으로 맞춰요</span>
          <span className="clock-target-time">{timeLabel(round.target)}</span>
          <SpeakButton clip={timeVoiceIds(round.target)} label="시간 다시 듣기" />
        </div>
        <ClockFace time={time} step={step} interactive hourOnly={hourOnly} minuteRing={step <= 15} onChange={setTime} onRelease={released} />
        {showReadout && <TimeReadout time={time} />}
        {nudges}
        <button className="adventure-primary clock-check" onClick={check}>확인</button>
      </div> : <div key={shakes} className={shakes ? 'numbers-shake' : undefined}>
        <div className="flex items-center justify-center gap-3"><p className="clock-prompt">시계가 몇 시를 가리키고 있나요?</p><SpeakButton clip={voiceId.phrase('clock-read')} label="문제 듣기" /></div>
        <ClockFace time={round.target} step={step} minuteRing={step <= 15} />
        <div className="clock-options" role="group" aria-label="답 고르기">
          {round.options.map((option) => <button key={option} className="clock-option" data-correct={option === round.target} onClick={() => answer(option)} aria-label={`답 ${timeLabel(option)}`}>{timeLabel(option)}</button>)}
        </div>
      </div>}

      <p className="clock-feedback" role="status">{message}</p>
    </section> : null}
  </AdventureFrame>;
}
