import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { getGameConfig } from '@/data/game-configs';
import { shuffled } from '@/data/picture-content';

/**
 * Place value with egg cartons: every ten eggs are packed into one carton, so
 * 23 is seen as two full cartons and three loose eggs. Reading rounds (cartons
 * → number) and building rounds (number → cartons) alternate, and a correct
 * answer always ends with the split written out, "20 + 3 = 23".
 */
const RANGES: Record<Difficulty, number> = { easy: 20, normal: 30, hard: 50 };
const CONFIG = getGameConfig('tens-ones')!;
const REVEAL_MS = 1300;

type Mode = 'read' | 'build';
interface Round { mode: Mode; value: number; options: number[] }

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
/** The answer plus the classic slips — swapped digits, one carton or one egg off. */
function optionsFor(answer: number, max: number, count: number): number[] {
  const tens = Math.floor(answer / 10);
  const ones = answer % 10;
  const near = shuffled([ones * 10 + tens, answer + 10, answer - 10, answer + 1, answer - 1, answer + 2, answer - 2]);
  const options = new Set([answer]);
  for (const candidate of near) {
    if (options.size >= count) break;
    if (candidate >= 10 && candidate <= max) options.add(candidate);
  }
  while (options.size < count) options.add(randomInt(10, max));
  return shuffled([...options]);
}
function buildRounds(count: number, max: number, choices: number): Round[] {
  let previous = 0;
  return Array.from({ length: count }, (_, index) => {
    let value = randomInt(11, max);
    while (value === previous) value = randomInt(11, max);
    previous = value;
    return { mode: index % 2 === 0 ? 'read' : 'build', value, options: optionsFor(value, max, choices) };
  });
}

/** Cartons of ten and loose eggs — the same picture for reading a number and for building one. */
function EggTray({ tens, ones, cumulative }: { tens: number; ones: number; cumulative: boolean }) {
  return <div className="tens-tray" role="img" aria-label={`10개 묶음 ${tens}개와 낱개 ${ones}개`}>
    <div className="tens-cartons">
      {Array.from({ length: tens }, (_, carton) => <motion.div key={carton} className="tens-carton" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
        <span className="tens-carton-label">{cumulative ? (carton + 1) * 10 : 10}</span>
        {Array.from({ length: 10 }, (_, egg) => <Picture key={egg} id="egg" className="h-5 w-5" />)}
      </motion.div>)}
    </div>
    <div className="tens-loose">
      {Array.from({ length: ones }, (_, egg) => <motion.span key={egg} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
        <Picture id="egg" className="h-8 w-8" />
      </motion.span>)}
      {cumulative && ones > 0 && <span className="tens-loose-label">+{ones}</span>}
    </div>
  </div>;
}

export default function TensOnesGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [shakes, setShakes] = useState(0);
  const [reveal, setReveal] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const game = useGameLogic({ gameId: 'tens-ones', category: 'numbers' });
  const { finish } = game;
  const { play } = useSound();
  const max = RANGES[difficulty];
  const questionCount = CONFIG.difficulties[difficulty].questionCount ?? 6;
  const round = rounds[index];
  const total = rounds.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const built = tens * 10 + ones;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    if (timer.current) clearTimeout(timer.current);
    setRounds(buildRounds(questionCount, max, difficulty === 'easy' ? 3 : 4));
    setIndex(0); setTens(0); setOnes(0); setHadError(false); setShakes(0); setReveal(null); setShowReward(true);
    setMessage('10개씩 묶음과 낱개를 세어 봐요.');
    game.start(questionCount);
  }

  function succeed(value: number) {
    if (!hadError) game.addScore();
    else play('correct');
    setMessage(`${Math.floor(value / 10) * 10} + ${value % 10} = ${value}! 10개씩 묶음 ${Math.floor(value / 10)}개와 낱개 ${value % 10}개예요.`);
    setReveal(value);
    // The split stays on screen for a moment, then the next round comes on its own.
    timer.current = setTimeout(() => {
      setReveal(null);
      if (index + 1 === total) { finish(); return; }
      play('confetti');
      setIndex(index + 1); setTens(0); setOnes(0); setHadError(false); setShakes(0); setMessage('');
    }, REVEAL_MS);
  }
  function fail(text: string) {
    setHadError(true); setShakes((count) => count + 1); game.wrongAnswer(); setMessage(text);
  }

  function answer(value: number) {
    if (game.state !== 'playing' || !round || reveal !== null) return;
    if (value !== round.value) return fail(`${value}은(는) 아니에요. 묶음은 10씩, 낱개는 1씩 세어 볼까요?`);
    succeed(value);
  }

  function adjust(kind: 'tens' | 'ones', step: 1 | -1) {
    if (game.state !== 'playing' || !round || reveal !== null) return;
    if (kind === 'tens') {
      const next = tens + step;
      if (next < 0 || next > Math.floor(max / 10)) return;
      setTens(next);
    } else {
      const next = ones + step;
      if (next < 0) return;
      // Ten loose eggs are exactly one carton — pack them instead of lining up more.
      if (next === 10) {
        if (tens + 1 > Math.floor(max / 10)) return;
        setTens(tens + 1); setOnes(0);
        setMessage('낱개 10개가 모여 10개씩 묶음 1개가 됐어요!');
        play('star_earned');
        return;
      }
      setOnes(next);
    }
    play(step === 1 ? 'drag_drop' : 'button_click');
    setMessage('');
  }

  function check() {
    if (game.state !== 'playing' || !round || reveal !== null) return;
    if (built !== round.value) {
      return fail(built < round.value ? `지금은 ${built}개예요. ${round.value}이 되려면 더 넣어야 해요.` : `지금은 ${built}개예요. ${round.value}보다 많아요. 조금 빼 볼까요?`);
    }
    succeed(round.value);
  }

  return <AdventureFrame title="또리의 달걀 농장" subtitle="10개씩 묶음과 낱개로 수를 읽고 만들어요.">
    {game.state === 'ready' ? <AdventureIntro picture="egg" title="달걀을 10개씩 묶어 세어 볼까요?" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={['달걀 10개가 모이면 한 상자에 담겨요.', '읽기에서는 상자와 낱개를 세어 수를 골라요.', '만들기에서는 상자와 낱개를 눌러 수를 만들어요.']}>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{questionCount}문제 · 11부터 {max}까지 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <Picture id="egg" className="mx-auto h-24 w-24 animate-float" />
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">달걀을 모두 묶어 세었어요!</h2>
      <p className="mt-3 text-slate-600">{total}문제 가운데 {game.score}문제를 한 번에 맞혔어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="10개씩 묶음과 낱개로 수를 알게 됐어요!" />
    </section> : round ? <section className="tens-farm">
      <div className="tens-fence" aria-hidden="true" />
      <div className="px-4 pt-3"><RoundProgress round={index + 1} total={total} /></div>

      {reveal !== null ? <div className="tens-reveal">
        <EggTray tens={Math.floor(reveal / 10)} ones={reveal % 10} cumulative />
        <p className="tens-equation" role="math" aria-label={`${Math.floor(reveal / 10) * 10} 더하기 ${reveal % 10}는 ${reveal}`}>
          <span>{Math.floor(reveal / 10) * 10}</span><em>+</em><span>{reveal % 10}</span><em>=</em><strong>{reveal}</strong>
        </p>
      </div> : round.mode === 'read' ? <div key={shakes} className={shakes ? 'numbers-shake' : undefined}>
        <p className="tens-prompt">상자와 낱개를 세어 봐요. 달걀은 모두 몇 개일까요?</p>
        <EggTray tens={Math.floor(round.value / 10)} ones={round.value % 10} cumulative={difficulty === 'easy'} />
        <div className="tens-options" role="group" aria-label="답 고르기">
          {round.options.map((option) => <button key={option} className="tens-option" data-correct={option === round.value} onClick={() => answer(option)} aria-label={`답 ${option}`}>{option}</button>)}
        </div>
      </div> : <div key={shakes} className={shakes ? 'numbers-shake' : undefined}>
        <p className="tens-prompt">이 수만큼 달걀을 담아요.</p>
        <p className="tens-target" data-target={round.value} aria-label={`목표 ${round.value}`}>{round.value}</p>
        <EggTray tens={tens} ones={ones} cumulative={difficulty === 'easy'} />
        <p className="tens-counter" aria-live="polite">10개씩 묶음 {tens}개, 낱개 {ones}개 = <strong>{built}</strong></p>
        <div className="tens-buttons" role="group" aria-label="묶음과 낱개 넣기">
          <button className="tens-button" onClick={() => adjust('tens', 1)} aria-label="10묶음 더하기"><span className="tens-button-icon">+</span>10묶음</button>
          <button className="tens-button" onClick={() => adjust('tens', -1)} disabled={tens === 0} aria-label="10묶음 빼기"><span className="tens-button-icon">−</span>10묶음</button>
          <button className="tens-button" onClick={() => adjust('ones', 1)} aria-label="낱개 더하기"><span className="tens-button-icon">+</span>낱개</button>
          <button className="tens-button" onClick={() => adjust('ones', -1)} disabled={ones === 0} aria-label="낱개 빼기"><span className="tens-button-icon">−</span>낱개</button>
        </div>
        <button className="adventure-primary tens-check" onClick={check} disabled={built === 0}>확인</button>
      </div>}

      <p className="tens-feedback" role="status">{message}</p>
    </section> : null}
  </AdventureFrame>;
}
