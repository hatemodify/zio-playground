import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useTTS } from '@/hooks/use-tts';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import type { LearningCategory } from '@/types/learning';

const BALLOON_COLORS = ['#FF6B81', '#4A90D9', '#2ED573', '#FFD93D', '#A29BFE', '#FF9FF3'];

interface Balloon {
  id: string;
  character: string;
  color: string;
  x: number;
  delay: number;
}

interface BalloonQuestion {
  answer: string;
  ttsText: string;
  ttsLang: 'ko-KR' | 'en-US';
  balloons: Balloon[];
}

function generateBalloonQuestion(category: LearningCategory, questionIndex: number): BalloonQuestion {
  let source: { character: string; ttsText: string; ttsLang: 'ko-KR' | 'en-US' }[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => ({ character: n.character, ttsText: n.koreanName, ttsLang: 'ko-KR' as const }));
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => ({ character: h.character, ttsText: h.name, ttsLang: 'ko-KR' as const }));
  } else {
    source = ENGLISH_DATA.map((e) => ({ character: e.uppercase, ttsText: e.word, ttsLang: 'en-US' as const }));
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const answer = shuffled[0];
  const distractors = shuffled.slice(1, 5);
  const allItems = [answer, ...distractors].sort(() => Math.random() - 0.5);

  const balloons: Balloon[] = allItems.map((item, i) => ({
    id: `balloon-${questionIndex}-${i}`,
    character: item.character,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    x: 10 + Math.random() * 60,
    delay: i * 0.4,
  }));

  return {
    answer: answer.character,
    ttsText: `${answer.ttsText}을(를) 찾아서 터뜨려 봐!`,
    ttsLang: answer.ttsLang,
    balloons,
  };
}

export default function BalloonGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, wrongAnswer, finish, reset, score, calculateStars } = useGameLogic({});

  const [category] = useState<LearningCategory>('numbers');
  const [currentQ, setCurrentQ] = useState(0);
  const [totalQuestions] = useState(10);
  const [question, setQuestion] = useState<BalloonQuestion | null>(null);
  const [poppedBalloons, setPoppedBalloons] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showReward, setShowReward] = useState(true);

  const loadQuestion = useCallback((qIndex: number) => {
    const q = generateBalloonQuestion(category, qIndex);
    setQuestion(q);
    setPoppedBalloons(new Set());
    setFeedback(null);
    speak(q.ttsText, q.ttsLang).catch(() => {});
  }, [category, speak]);

  const startGame = useCallback(() => {
    setCurrentQ(0);
    start(totalQuestions);
    loadQuestion(0);
  }, [start, totalQuestions, loadQuestion]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBalloonClick = useCallback((balloon: Balloon) => {
    if (poppedBalloons.has(balloon.id) || !question || feedback !== null) return;

    if (balloon.character === question.answer) {
      // Correct!
      setFeedback('correct');
      play('balloon_pop');
      setPoppedBalloons((prev) => new Set([...prev, balloon.id]));
      addScore(1);

      setTimeout(() => {
        if (currentQ + 1 >= totalQuestions) {
          finish();
        } else {
          setCurrentQ((c) => c + 1);
          loadQuestion(currentQ + 1);
        }
      }, 1000);
    } else {
      // Wrong
      setFeedback('wrong');
      play('wrong');
      wrongAnswer();
      setTimeout(() => setFeedback(null), 800);
    }
  }, [question, poppedBalloons, feedback, play, addScore, wrongAnswer, currentQ, totalQuestions, finish, loadQuestion]);

  const handleRestart = useCallback(() => {
    setShowReward(true);
    reset();
    startGame();
  }, [reset, startGame]);

  const finalStars = gameState === 'reward' ? calculateStars(score) : 0;

  if (gameState === 'reward') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8  h-full justify-center">
        <RewardCelebration
          type="game_complete"
          stars={finalStars}
          open={showReward}
          onDismiss={() => {
            setShowReward(false);
            recordGameScore({
              gameId: 'balloon',
              category,
              score,
              stars: finalStars,
              completedAt: new Date().toISOString(),
              duration: 0,
            });
          }}
        />
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" size="lg" onClick={handleRestart}>다시 하기</Button>
          <Button variant="primary" size="lg" onClick={() => navigate('/games')}>게임 목록</Button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">풍선 터뜨리기</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentQ + 1} / {totalQuestions}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / totalQuestions) * 100}%` }}
        />
      </div>

      {/* TTS replay */}
      <div className="flex items-center justify-center gap-2">
        <motion.button
          className="flex items-center gap-2 rounded-full bg-games/10 px-4 py-2 touch-manipulation"
          whileTap={{ scale: 0.95 }}
          onClick={() => question && speak(question.ttsText, question.ttsLang)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-games)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span className="text-sm font-medium text-games">다시 듣기</span>
        </motion.button>
      </div>

      {/* Balloon area */}
      <div className="relative h-[360px] overflow-hidden rounded-3xl bg-gradient-to-b from-blue-100 to-blue-50">
        <AnimatePresence>
          {question.balloons.map((balloon) => {
            const isPopped = poppedBalloons.has(balloon.id);
            if (isPopped) return null;

            return (
              <motion.button
                key={balloon.id}
                className="absolute touch-manipulation select-none"
                style={{ left: `${balloon.x}%` }}
                initial={{ y: 400, opacity: 0, scale: 0.8 }}
                animate={{
                  y: -120,
                  opacity: 1,
                  scale: 1,
                  x: [0, 15, -15, 10, -10, 0],
                }}
                exit={{ scale: [1, 1.3, 0], opacity: 0 }}
                transition={{
                  y: { duration: 8, delay: balloon.delay, ease: 'linear', repeat: Infinity },
                  x: { duration: 4, delay: balloon.delay, repeat: Infinity, ease: 'easeInOut' },
                  opacity: { duration: 0.3, delay: balloon.delay },
                  scale: { duration: 0.3, delay: balloon.delay },
                }}
                onClick={() => handleBalloonClick(balloon)}
                whileTap={{ scale: 0.9 }}
              >
                {/* Balloon SVG */}
                <svg width="70" height="90" viewBox="0 0 70 90">
                  <ellipse cx="35" cy="35" rx="30" ry="35" fill={balloon.color} opacity="0.85" />
                  <ellipse cx="25" cy="22" rx="8" ry="10" fill="white" opacity="0.3" />
                  <polygon points="35,70 30,75 40,75" fill={balloon.color} opacity="0.7" />
                  <line x1="35" y1="75" x2="35" y2="88" stroke={balloon.color} strokeWidth="1.5" opacity="0.5" />
                  <text x="35" y="42" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="22" fill="white">
                    {balloon.character}
                  </text>
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="text-5xl font-bold text-success"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 0.5 }}
              >
                정답!
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : feedback === 'wrong' ? 'encouraging' : 'happy'}
          size="sm"
          message={feedback === 'wrong' ? '아니야, 다시!' : undefined}
        />
      </div>
    </div>
  );
}
