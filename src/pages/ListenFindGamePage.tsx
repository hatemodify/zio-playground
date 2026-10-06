import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useSound } from '@/hooks/use-sound';
import { useVoice } from '@/hooks/use-voice';
import { getGameConfig } from '@/data/game-configs';
import { ENGLISH_DATA } from '@/data/english';
import { HANGUL_CONSONANTS, HANGUL_VOWELS, HANGUL_SYLLABLES, SYLLABLE_WORDS } from '@/data/hangul';
import { hasPicture, pictureName, shuffled, PICTURE_WORDS, TWEMOJI_PICTURES, type PictureId } from '@/data/picture-content';
import { voiceId, VOICE_PHRASES } from '@/data/voice-lines';
import { soundManager } from '@/lib/sound-manager';

/**
 * Listening comes before reading: a pre-recorded line plays and the child
 * finds what they heard. Three activities share the screen — a sound to its
 * letter, a word to its picture, and a word to its first letter (the step
 * phonics builds on). Hangul and English use the same rounds.
 */
type Lang = 'ko' | 'en';
type Mode = 'char' | 'word' | 'first';

interface Choice { key: string; text?: string; picture?: PictureId }
interface Round { clip: string; promptClip: string; answer: string; choices: Choice[]; reveal: string }

const LISTEN_CONFIG = getGameConfig('listen-find')!;
const MODES: { id: Mode; label: string; phrase: string; icon: PictureId }[] = [
  { id: 'char', label: '글자 소리', phrase: 'listen-char', icon: 'parrot' },
  { id: 'word', label: '단어 소리', phrase: 'listen-word', icon: 'rabbit' },
  { id: 'first', label: '첫 글자', phrase: 'listen-first', icon: 'giraffe' },
];

interface KoWord { word: string; image: PictureId }
const KO_WORDS: KoWord[] = [
  ...Object.values(SYLLABLE_WORDS),
  ...HANGUL_CONSONANTS.map((item) => ({ word: item.representativeWord, image: item.wordImage })),
  ...HANGUL_VOWELS.map((item) => ({ word: item.representativeWord, image: item.wordImage })),
].filter((entry, index, all): entry is KoWord => hasPicture(entry.image) && all.findIndex((other) => other.word === entry.word) === index);
const EN_WORDS = ENGLISH_DATA.filter((item) => hasPicture(item.wordImage));
const KO_CHARS = [...HANGUL_CONSONANTS, ...HANGUL_VOWELS, ...HANGUL_SYLLABLES.filter((item) => item.character in SYLLABLE_WORDS)];

function englishName(id: PictureId): string {
  return PICTURE_WORDS.find((word) => word.id === id)?.english ?? (TWEMOJI_PICTURES as Record<string, { english: string }>)[id]?.english ?? id;
}
function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
/** `count` distinct items that pass `ok`, the answer first; falls back to any item when a tight filter runs dry. */
function fill<T>(answer: T, pool: T[], count: number, key: (item: T) => string, ok: (item: T) => boolean = () => true): T[] {
  const picked = [answer];
  const keys = new Set([key(answer)]);
  const tryPool = (candidates: T[]) => {
    for (const item of shuffled(candidates)) {
      if (picked.length >= count) break;
      if (keys.has(key(item))) continue;
      keys.add(key(item)); picked.push(item);
    }
  };
  tryPool(pool.filter(ok));
  tryPool(pool);
  return picked;
}

function buildRound(lang: Lang, mode: Mode, difficulty: Difficulty, choiceCount: number): Round {
  const hard = difficulty === 'hard';
  if (mode === 'char') {
    if (lang === 'ko') {
      const pool = difficulty === 'easy' ? [...HANGUL_CONSONANTS, ...HANGUL_VOWELS] : KO_CHARS;
      const answer = pick(pool);
      // Hardest level keeps the same vowel so the ear has to separate the consonants.
      const choices = fill(answer, pool, choiceCount, (item) => item.character, (item) => item.type === answer.type && (!hard || item.vowel === answer.vowel));
      return { clip: voiceId.hangul(answer.character), promptClip: voiceId.phrase('listen-char'), answer: answer.character, reveal: answer.name,
        choices: shuffled(choices).map((item) => ({ key: item.character, text: item.character })) };
    }
    const answer = pick(ENGLISH_DATA);
    const choices = fill(answer, ENGLISH_DATA, choiceCount, (item) => item.uppercase);
    return { clip: voiceId.letter(answer.uppercase), promptClip: voiceId.phrase('listen-char'), answer: answer.uppercase, reveal: answer.uppercase,
      choices: shuffled(choices).map((item) => ({ key: item.uppercase, text: hard ? item.lowercase : item.uppercase })) };
  }
  if (mode === 'word') {
    if (lang === 'ko') {
      const answer = pick(KO_WORDS);
      const choices = fill(answer, KO_WORDS, choiceCount, (item) => item.image, (item) => !hard || item.word[0] === answer.word[0]);
      return { clip: voiceId.word('ko', answer.image), promptClip: voiceId.phrase('listen-word'), answer: answer.image, reveal: answer.word,
        choices: shuffled(choices).map((item) => ({ key: item.image, picture: item.image })) };
    }
    const answer = pick(EN_WORDS);
    const choices = fill(answer, EN_WORDS, choiceCount, (item) => item.wordImage);
    return { clip: voiceId.word('en', answer.wordImage), promptClip: voiceId.phrase('listen-word'), answer: answer.wordImage, reveal: englishName(answer.wordImage as PictureId),
      choices: shuffled(choices).map((item) => ({ key: item.wordImage, picture: item.wordImage as PictureId })) };
  }
  if (lang === 'ko') {
    const words = KO_WORDS.filter((item) => item.word[0] in SYLLABLE_WORDS);
    const answer = pick(words);
    const first = answer.word[0];
    const syllable = HANGUL_SYLLABLES.find((item) => item.character === first)!;
    const pool = HANGUL_SYLLABLES.filter((item) => item.character in SYLLABLE_WORDS);
    const choices = fill(syllable, pool, choiceCount, (item) => item.character, (item) => !hard || item.vowel === syllable.vowel);
    return { clip: voiceId.word('ko', answer.image), promptClip: voiceId.phrase('listen-first'), answer: first, reveal: answer.word,
      choices: shuffled(choices).map((item) => ({ key: item.character, text: item.character })) };
  }
  const answer = pick(EN_WORDS);
  const first = englishName(answer.wordImage as PictureId)[0].toUpperCase();
  const letter = ENGLISH_DATA.find((item) => item.uppercase === first) ?? answer;
  const choices = fill(letter, ENGLISH_DATA, choiceCount, (item) => item.uppercase);
  return { clip: voiceId.word('en', answer.wordImage), promptClip: voiceId.phrase('listen-first'), answer: letter.uppercase, reveal: englishName(answer.wordImage as PictureId),
    choices: shuffled(choices).map((item) => ({ key: item.uppercase, text: item.uppercase })) };
}

function buildRounds(lang: Lang, mode: Mode, difficulty: Difficulty): Round[] {
  const level = LISTEN_CONFIG.difficulties[difficulty];
  const choiceCount = difficulty === 'easy' ? 3 : 4;
  const rounds: Round[] = [];
  while (rounds.length < (level.questionCount ?? 6)) {
    const round = buildRound(lang, mode, difficulty, choiceCount);
    if (!rounds.some((other) => other.clip === round.clip)) rounds.push(round);
  }
  return rounds;
}

export default function ListenFindGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [lang, setLang] = useState<Lang>('ko');
  const [mode, setMode] = useState<Mode>('char');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [hadError, setHadError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const [showReward, setShowReward] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const game = useGameLogic({ gameId: 'listen-find', category: lang === 'ko' ? 'hangul' : 'english' });
  const { play } = useSound();
  const { speak, preload } = useVoice({ always: true });
  const round = rounds[index];
  const total = rounds.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const modeInfo = MODES.find((item) => item.id === mode)!;
  const level = LISTEN_CONFIG.difficulties[difficulty];
  const playingRef = useRef(false);

  function start() {
    const next = buildRounds(lang, mode, difficulty);
    setRounds(next); setIndex(0); setHadError(false); setShowHint(false); setShaking(null); setShowReward(true); setLocked(false);
    setMessage('스피커를 눌러 소리를 들어요.');
    preload(next.map((item) => item.clip));
    game.start(next.length);
  }

  async function replay() {
    if (!round || playingRef.current) return;
    playingRef.current = true; setSpeaking(true);
    const heard = await speak(round.clip);
    setSpeaking(false); playingRef.current = false;
    if (!heard && !soundManager.ready) setMessage('화면을 한 번 누른 뒤 스피커를 다시 눌러 주세요.');
  }

  function answer(choice: Choice) {
    if (game.state !== 'playing' || !round || locked) return;
    if (choice.key !== round.answer) {
      setHadError(true); game.wrongAnswer(); setShaking(choice.key);
      window.setTimeout(() => setShaking(null), 500);
      setMessage('다시 한번 잘 들어 볼까요?');
      return;
    }
    if (!hadError) game.addScore();
    play('correct');
    setMessage(mode === 'word' ? `${round.reveal}! 잘 들었어요.` : `"${round.reveal}" 소리는 ${round.answer}! 잘 들었어요.`);
    if (index + 1 === total) { game.finish(); return; }
    setLocked(true);
    window.setTimeout(() => { setIndex(index + 1); setHadError(false); setShowHint(false); setLocked(false); }, 650);
  }

  return <AdventureFrame title="듣고 찾기" subtitle="잘 듣고 글자와 그림을 찾아요.">
    {game.state === 'ready' ? <AdventureIntro picture={modeInfo.icon} title="귀를 쫑긋! 무슨 소리일까요?" difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}
      instructions={mode === 'char'
        ? ['스피커에서 글자 소리가 나와요.', '들은 소리와 같은 글자를 골라요.', '잘 모르겠으면 스피커를 다시 눌러요.']
        : mode === 'word'
          ? ['스피커에서 단어 소리가 나와요.', '들은 단어의 그림을 골라요.', '잘 모르겠으면 스피커를 다시 눌러요.']
          : ['스피커에서 단어 소리가 나와요.', '그 단어가 어떤 글자로 시작하는지 골라요.', '잘 모르겠으면 스피커를 다시 눌러요.']}>
      <div className="mt-5 flex gap-2" role="group" aria-label="언어 고르기">
        {([{ id: 'ko', label: '한글' }, { id: 'en', label: '영어' }] as const).map((item) => <button key={item.id} type="button" className={`adventure-secondary flex-1 ${lang === item.id ? 'border-teal-600 bg-teal-50 text-teal-800' : ''}`} aria-pressed={lang === item.id} onClick={() => setLang(item.id)}>{item.label}</button>)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="놀이 고르기">
        {MODES.map((item) => <button key={item.id} type="button" className={`adventure-secondary ${mode === item.id ? 'border-teal-600 bg-teal-50 text-teal-800' : ''}`} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>{item.label}</button>)}
      </div>
      <p className="mt-4 text-center text-sm font-bold text-teal-800">{level.questionCount ?? 6}문제 · {difficulty === 'easy' ? '3개' : '4개'} 중에서 고르기 · 시간 제한 없음</p>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <Picture id={modeInfo.icon} className="mx-auto h-24 w-24 animate-float" />
      <h2 className="mt-3 text-2xl font-extrabold text-slate-800">소리를 모두 찾았어요!</h2>
      <p className="mt-3 text-slate-600">{total}개의 소리 가운데 {game.score}개를 한 번에 찾았어요.</p>
      <button className="adventure-primary mt-5" onClick={game.reset}>다시 놀기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} message="귀를 쫑긋 세우고 잘 들었어요!" />
    </section> : round ? <section className="listen-stage" data-answer={round.answer}>
      <div className="px-4 pt-3"><RoundProgress round={index + 1} total={total} /></div>
      <div className="listen-prompt">
        <motion.button type="button" className={`listen-speaker ${speaking ? 'listen-speaker-playing' : ''}`} onClick={replay} aria-label="듣기" whileTap={{ scale: 0.92 }} data-voice-clip={round.clip}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        </motion.button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-slate-800">{VOICE_PHRASES[modeInfo.phrase]}</p>
          <p className="mt-1 text-sm text-slate-600" aria-live="polite">{message}</p>
          {showHint ? <p className="mt-2 text-base font-bold text-teal-700" data-testid="listen-hint">힌트: {round.reveal}</p>
            : hadError && <button type="button" className="mt-2 text-sm font-bold text-teal-700 underline" onClick={() => setShowHint(true)}>힌트 보기</button>}
        </div>
      </div>
      <div className={`listen-choices ${round.choices.length === 3 ? 'listen-choices-3' : ''}`} role="group" aria-label="보기">
        {round.choices.map((choice) => <motion.button key={choice.key} type="button" className={`picture-choice listen-choice ${choice.picture ? '' : 'listen-choice-text'}`}
          data-correct={choice.key === round.answer ? 'true' : undefined} aria-label={choice.picture ? pictureName(choice.picture) : choice.text}
          animate={shaking === choice.key ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.45 }} onClick={() => answer(choice)} disabled={locked}
          aria-pressed={locked && choice.key === round.answer ? true : undefined}>
          {choice.picture ? <Picture id={choice.picture} className="h-20 w-20 sm:h-24 sm:w-24" /> : <span className={lang === 'ko' ? 'font-bold' : 'font-display font-extrabold'}>{choice.text}</span>}
        </motion.button>)}
      </div>
    </section> : null}
  </AdventureFrame>;
}
