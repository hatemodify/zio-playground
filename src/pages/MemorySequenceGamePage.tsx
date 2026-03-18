import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { RewardCelebration } from '@/components/features';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSound } from '@/hooks/use-sound';
import { NUMBERS_DATA } from '@/data/numbers';
import { HANGUL_DATA } from '@/data/hangul';
import { ENGLISH_DATA } from '@/data/english';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

type Phase = 'showing' | 'input' | 'result';

interface MemoryRound {
  sequence: string[];
  displayItems: string[]; // all items to show as buttons
}

function generateRounds(category: LearningCategory, count: number): MemoryRound[] {
  let chars: string[];
  if (category === 'numbers') {
    chars = NUMBERS_DATA.map((n) => n.character);
  } else if (category === 'hangul') {
    chars = HANGUL_DATA.slice(0, 14).map((h) => h.character); // consonants only for simplicity
  } else {
    chars = ENGLISH_DATA.slice(0, 10).map((e) => e.uppercase); // A-J for simplicity
  }

  const rounds: MemoryRound[] = [];
  for (let i = 0; i < count; i++) {
    const seqLen = 3 + Math.min(i, 4); // starts at 3, grows to 7
    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    const sequence = shuffled.slice(0, seqLen);
    // Show more items than the sequence for the input phase
    const extraCount = Math.min(3, chars.length - seqLen);
    const extra = shuffled.slice(seqLen, seqLen + extraCount);
    const displayItems = [...sequence, ...extra].sort(() => Math.random() - 0.5);
    rounds.push({ sequence, displayItems });
  }
  return rounds;
}

export default function MemorySequenceGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const { state, score, start, addScore, wrongAnswer, finish, calculateStars } = useGameLogic();

  const TOTAL_ROUNDS = 5;
  const [rounds, setRounds] = useState<MemoryRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('showing');
  const [showingIdx, setShowingIdx] = useState(-1);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [roundCorrect, setRoundCorrect] = useState<boolean | null>(null);
  const [showReward, setShowReward] = useState(true);
  const scoreRef = useRef(0);

  const currentRound = rounds[roundIdx];

  const handleStart = useCallback(() => {
    const r = generateRounds(category, TOTAL_ROUNDS);
    setRounds(r);
    setRoundIdx(0);
    setPhase('showing');
    setShowingIdx(-1);
    setUserInput([]);
    setRoundCorrect(null);
    scoreRef.current = 0;
    start(TOTAL_ROUNDS);
  }, [category, start]);

  // Show sequence animation
  useEffect(() => {
    if (state !== 'playing' || phase !== 'showing' || !currentRound) return;

    const seq = currentRound.sequence;
    let idx = 0;
    setShowingIdx(-1);

    const showNext = () => {
      if (idx < seq.length) {
        setShowingIdx(idx);
        idx++;
        setTimeout(showNext, 800);
      } else {
        setShowingIdx(-1);
        setTimeout(() => setPhase('input'), 400);
      }
    };

    const timer = setTimeout(showNext, 500);
    return () => clearTimeout(timer);
  }, [state, phase, currentRound, roundIdx]);

  const handleInput = useCallback((char: string) => {
    if (phase !== 'input' || !currentRound) return;

    const newInput = [...userInput, char];
    setUserInput(newInput);

    const expectedIdx = newInput.length - 1;
    const isCorrectSoFar = currentRound.sequence[expectedIdx] === char;

    if (!isCorrectSoFar) {
      // Wrong answer for this round
      play('wrong');
      setRoundCorrect(false);
      setPhase('result');
      wrongAnswer();

      setTimeout(() => {
        if (roundIdx < TOTAL_ROUNDS - 1) {
          setRoundIdx((prev) => prev + 1);
          setPhase('showing');
          setUserInput([]);
          setRoundCorrect(null);
        } else {
          finish(scoreRef.current);
        }
      }, 1500);
      return;
    }

    if (newInput.length === currentRound.sequence.length) {
      // Completed correctly
      play('correct');
      setRoundCorrect(true);
      setPhase('result');
      addScore(1);
      scoreRef.current += 1;

      setTimeout(() => {
        if (roundIdx < TOTAL_ROUNDS - 1) {
          setRoundIdx((prev) => prev + 1);
          setPhase('showing');
          setUserInput([]);
          setRoundCorrect(null);
        } else {
          finish(scoreRef.current);
        }
      }, 1500);
    } else {
      play('button_click');
    }
  }, [phase, currentRound, userInput, roundIdx, addScore, wrongAnswer, finish, play]);

  const handleFinish = useCallback(() => {
    const stars = calculateStars(score);
    recordGameScore({
      gameId: 'memory-sequence',
      category,
      score,
      stars,
      completedAt: new Date().toISOString(),
      duration: 0,
    });
    navigate('/games');
  }, [score, category, calculateStars, recordGameScore, navigate]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-games">순서 기억하기</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
          돌아가기
        </Button>
      </div>

      {state === 'ready' && (
        <motion.div
          className="flex flex-col items-center gap-6 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex gap-2">
            {(['numbers', 'hangul', 'english'] as LearningCategory[]).map((c) => (
              <button
                key={c}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-all',
                  category === c ? 'bg-primary text-white' : 'bg-primary/10 text-primary',
                )}
                onClick={() => setCategory(c)}
              >
                {c === 'numbers' ? '숫자' : c === 'hangul' ? '한글' : '영어'}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-bg-soft p-6">
            <span className="text-6xl">🧠</span>
            <p className="text-lg font-bold text-text-dark">순서를 기억하세요!</p>
            <p className="text-center text-sm text-text-medium">
              글자가 하나씩 나타나요. 순서를 기억하고 따라 눌러보세요!
            </p>
          </div>

          <Button size="xl" onClick={handleStart}>
            시작하기
          </Button>
        </motion.div>
      )}

      {state === 'playing' && currentRound && (
        <motion.div
          className="flex flex-col items-center gap-5 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3 text-sm text-text-medium">
            <span>라운드 {roundIdx + 1} / {TOTAL_ROUNDS}</span>
            <span className="text-accent-yellow font-bold">{score}점</span>
          </div>

          {/* Phase: Showing */}
          {phase === 'showing' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-base font-medium text-text-medium">잘 보세요!</p>
              <motion.div
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10"
                key={`show-${showingIdx}`}
              >
                <AnimatePresence mode="wait">
                  {showingIdx >= 0 && (
                    <motion.span
                      key={showingIdx}
                      className="text-4xl font-bold text-primary"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {currentRound.sequence[showingIdx]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="flex gap-1">
                {currentRound.sequence.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i <= showingIdx ? 'bg-primary' : 'bg-gray-200',
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Phase: Input */}
          {phase === 'input' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-base font-medium text-text-medium">순서대로 눌러보세요!</p>

              {/* Progress dots */}
              <div className="flex gap-2">
                {currentRound.sequence.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                      i < userInput.length
                        ? 'bg-primary/20 text-primary'
                        : 'bg-gray-100 text-text-light',
                    )}
                  >
                    {i < userInput.length ? userInput[i] : '?'}
                  </div>
                ))}
              </div>

              {/* Input buttons */}
              <div className="flex flex-wrap justify-center gap-2">
                {currentRound.displayItems.map((char, i) => (
                  <motion.button
                    key={`${char}-${i}`}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-text-dark shadow-card touch-manipulation"
                    onClick={() => handleInput(char)}
                    whileTap={{ scale: 0.9 }}
                  >
                    {char}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Phase: Result */}
          {phase === 'result' && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className={cn('text-4xl', roundCorrect ? '' : '')}>
                {roundCorrect ? '🎉' : '😅'}
              </span>
              <p className={cn('text-lg font-bold', roundCorrect ? 'text-success' : 'text-error')}>
                {roundCorrect ? '정답!' : '아쉬워요!'}
              </p>
              {!roundCorrect && (
                <p className="text-sm text-text-medium">
                  정답: {currentRound.sequence.join(' → ')}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {(state === 'success' || state === 'reward') && (
        <RewardCelebration
          type="game_complete"
          stars={calculateStars(score)}
          message={`${TOTAL_ROUNDS}라운드 중 ${score}라운드 성공!`}
          open={showReward}
          onDismiss={() => { setShowReward(false); handleFinish(); }}
        />
      )}
    </div>
  );
}
