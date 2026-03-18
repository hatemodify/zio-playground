import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useTTS } from '@/hooks/use-tts';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface SpeakQuestion {
  character: string;
  label: string;
  ttsText: string;
  ttsLang: 'ko-KR' | 'en-US';
}

function generateQuestions(category: LearningCategory, count: number): SpeakQuestion[] {
  let source: SpeakQuestion[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => ({ character: n.character, label: n.koreanName, ttsText: n.koreanName, ttsLang: 'ko-KR' as const }));
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => ({ character: h.character, label: h.name, ttsText: h.name, ttsLang: 'ko-KR' as const }));
  } else {
    source = ENGLISH_DATA.map((e) => ({ character: e.uppercase, label: e.word, ttsText: e.word, ttsLang: 'en-US' as const }));
  }

  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export default function SpeakGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { speak } = useTTS();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [questions, setQuestions] = useState<SpeakQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [feedback, setFeedback] = useState<'success' | null>(null);
  const [showReward, setShowReward] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalQuestions = 5;

  const startGame = useCallback(() => {
    const qs = generateQuestions(category, totalQuestions);
    setQuestions(qs);
    setCurrentQ(0);
    setRecordingState('idle');
    setFeedback(null);
    start(totalQuestions);
  }, [category, start]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play TTS for current question
  useEffect(() => {
    if (gameState === 'playing' && questions[currentQ] && recordingState === 'idle' && feedback === null) {
      const q = questions[currentQ];
      speak(q.ttsText, q.ttsLang).catch(() => {});
    }
  }, [currentQ, gameState, questions, speak, recordingState, feedback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = URL.createObjectURL(blob);
          setRecordingState('recorded');
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');

      // Auto-stop after 3 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);
    } catch {
      // Microphone not available — auto-pass
      setRecordingState('recorded');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  }, []);

  const playRecording = useCallback(() => {
    if (!audioUrlRef.current) return;
    setRecordingState('playing');
    const audio = new Audio(audioUrlRef.current);
    audio.onended = () => setRecordingState('recorded');
    audio.play().catch(() => setRecordingState('recorded'));
  }, []);

  const handleConfirm = useCallback(() => {
    // Always accept — no accuracy judgment for kids
    setFeedback('success');
    play('correct');
    addScore(1);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        finish();
      } else {
        setCurrentQ((c) => c + 1);
        setRecordingState('idle');
        setFeedback(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      }
    }, 1200);
  }, [play, addScore, currentQ, questions, finish]);

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
              gameId: 'speak',
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

  const currentQuestion = questions[currentQ];
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">따라 말하기</h2>
        <span className="text-sm font-medium text-text-medium">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {(['numbers', 'hangul', 'english'] as LearningCategory[]).map((cat) => (
          <button
            key={cat}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-bold transition-all touch-manipulation',
              category === cat ? 'bg-games text-white shadow-button' : 'bg-games/10 text-text-medium',
            )}
            onClick={() => { setCategory(cat); reset(); }}
          >
            {cat === 'numbers' ? '숫자' : cat === 'hangul' ? '한글' : '영어'}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-games/15">
        <motion.div
          className="h-full rounded-full bg-games"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      {/* Character display */}
      <div className="flex flex-col items-center gap-3 py-6">
        <motion.div
          className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-card"
          key={currentQ}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <span className="font-display text-5xl font-bold text-games">{currentQuestion.character}</span>
        </motion.div>
        <span className="text-lg font-medium text-text-dark">{currentQuestion.label}</span>

        {/* Listen button */}
        <motion.button
          className="flex items-center gap-2 rounded-full bg-games/10 px-5 py-2.5 touch-manipulation"
          whileTap={{ scale: 0.95 }}
          onClick={() => speak(currentQuestion.ttsText, currentQuestion.ttsLang)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-games)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span className="text-sm font-medium text-games">다시 듣기</span>
        </motion.button>
      </div>

      {/* Recording controls */}
      <div className="flex flex-col items-center gap-4">
        {recordingState === 'idle' && (
          <motion.button
            className="flex h-20 w-20 items-center justify-center rounded-full bg-error/15 touch-manipulation"
            whileTap={{ scale: 0.9 }}
            onClick={startRecording}
            aria-label="녹음 시작"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </motion.button>
        )}

        {recordingState === 'recording' && (
          <motion.button
            className="flex h-20 w-20 items-center justify-center rounded-full bg-error touch-manipulation"
            onClick={stopRecording}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            aria-label="녹음 중지"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </motion.button>
        )}

        {recordingState === 'recorded' && !feedback && (
          <div className="flex gap-4">
            <motion.button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-games/15 touch-manipulation"
              whileTap={{ scale: 0.9 }}
              onClick={playRecording}
              aria-label="내 소리 듣기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-games)">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </motion.button>
            <motion.button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 touch-manipulation"
              whileTap={{ scale: 0.9 }}
              onClick={handleConfirm}
              aria-label="확인"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.button>
            <motion.button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 touch-manipulation"
              whileTap={{ scale: 0.9 }}
              onClick={() => setRecordingState('idle')}
              aria-label="다시 녹음"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-medium)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </motion.button>
          </div>
        )}

        {recordingState === 'playing' && (
          <span className="text-sm font-medium text-games">재생 중...</span>
        )}

        {feedback === 'success' && (
          <motion.span
            className="text-2xl font-bold text-success"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
          >
            잘했어!
          </motion.span>
        )}

        <span className="text-sm text-text-medium">
          {recordingState === 'idle' && '마이크 버튼을 누르고 따라 말해 보세요!'}
          {recordingState === 'recording' && '말하고 있어요... (3초)'}
          {recordingState === 'recorded' && !feedback && '내 소리를 들어보고 확인해 보세요!'}
        </span>
      </div>

      {/* Mascot */}
      <div className="flex justify-center pt-2">
        <CharacterDdori
          expression={feedback === 'success' ? 'celebrating' : recordingState === 'recording' ? 'excited' : 'encouraging'}
          size="sm"
          message={feedback === 'success' ? '정말 잘했어!' : recordingState === 'recording' ? '듣고 있어!' : undefined}
        />
      </div>
    </div>
  );
}
