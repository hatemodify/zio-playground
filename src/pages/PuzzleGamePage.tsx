import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { CharacterDdori, RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { useGamificationStore } from '@/stores/gamification-store';
import { NUMBERS_DATA, HANGUL_CONSONANTS, ENGLISH_DATA } from '@/data';
import { cn } from '@/lib/cn';
import type { LearningCategory } from '@/types/learning';

interface PuzzlePiece {
  id: number;
  character: string;
  correctPos: number;
  currentPos: number;
}

function generatePuzzle(category: LearningCategory, pieceCount: number): PuzzlePiece[] {
  let source: string[];
  if (category === 'numbers') {
    source = NUMBERS_DATA.map((n) => n.character);
  } else if (category === 'hangul') {
    source = HANGUL_CONSONANTS.map((h) => h.character);
  } else {
    source = ENGLISH_DATA.map((e) => e.uppercase);
  }

  const selected = [...source].sort(() => Math.random() - 0.5).slice(0, pieceCount);
  const positions = selected.map((_, i) => i).sort(() => Math.random() - 0.5);

  return selected.map((char, i) => ({
    id: i,
    character: char,
    correctPos: i,
    currentPos: positions[i],
  }));
}

export default function PuzzleGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { recordGameScore } = useGamificationStore();
  const { state: gameState, start, addScore, finish, reset, score, calculateStars } = useGameLogic({});

  const [category, setCategory] = useState<LearningCategory>('numbers');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [showReward, setShowReward] = useState(true);

  const pieceCount = 4;

  const loadRound = useCallback(() => {
    setPieces(generatePuzzle(category, pieceCount));
    setSelectedPiece(null);
    setMoves(0);
    setFeedback(null);
  }, [category, pieceCount]);

  const startGame = useCallback(() => {
    setCurrentRound(0);
    start(totalRounds);
    loadRound();
  }, [start, totalRounds, loadRound]);

  useEffect(() => {
    if (gameState === 'ready') {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSolved = useCallback((currentPieces: PuzzlePiece[]) => {
    return currentPieces.every((p) => p.currentPos === p.correctPos);
  }, []);

  const handlePieceClick = useCallback((pieceId: number) => {
    if (feedback !== null) return;

    if (selectedPiece === null) {
      setSelectedPiece(pieceId);
      play('card_flip');
    } else {
      // Swap pieces
      setMoves((m) => m + 1);
      setPieces((prev) => {
        const updated = prev.map((p) => ({ ...p }));
        const piece1 = updated.find((p) => p.id === selectedPiece)!;
        const piece2 = updated.find((p) => p.id === pieceId)!;
        const tempPos = piece1.currentPos;
        piece1.currentPos = piece2.currentPos;
        piece2.currentPos = tempPos;

        if (checkSolved(updated)) {
          setFeedback('correct');
          play('match_success');
          addScore(1);

          setTimeout(() => {
            if (currentRound + 1 >= totalRounds) {
              finish();
            } else {
              setCurrentRound((c) => c + 1);
              loadRound();
            }
          }, 800);
        }

        return updated;
      });
      setSelectedPiece(null);
    }
  }, [selectedPiece, feedback, play, checkSolved, addScore, currentRound, totalRounds, finish, loadRound]);

  const handleRestart = useCallback(() => {
    reset();
    setShowReward(true);
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
              gameId: 'puzzle',
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

  // Sort pieces by currentPos for display
  const displayPieces = [...pieces].sort((a, b) => a.currentPos - b.currentPos);
  const cols = pieceCount <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-games">퍼즐 맞추기</h2>
        <span className="text-sm font-medium text-text-medium">
          {currentRound + 1} / {totalRounds}
        </span>
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

      {/* Target order hint */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-games/5 p-3">
        <span className="text-sm font-medium text-text-medium">정답 순서:</span>
        <div className="flex gap-1">
          {pieces.map((p) => (
            <span key={p.id} className="text-lg font-bold text-games/50">{p.character}</span>
          ))}
        </div>
      </div>

      {/* Puzzle grid */}
      <div className={cn('grid gap-3', cols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {displayPieces.map((piece) => {
          const isCorrect = piece.currentPos === piece.correctPos;
          const isSelected = selectedPiece === piece.id;

          return (
            <motion.button
              key={piece.id}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl text-center touch-manipulation select-none',
                'text-3xl font-bold transition-all',
                isCorrect
                  ? 'bg-success/15 text-success ring-2 ring-success/30'
                  : isSelected
                    ? 'bg-games/20 text-games ring-2 ring-games shadow-lg scale-105'
                    : 'bg-white text-text-dark shadow-card',
              )}
              onClick={() => handlePieceClick(piece.id)}
              whileTap={{ scale: 0.95 }}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {piece.character}
            </motion.button>
          );
        })}
      </div>

      {/* Moves counter */}
      <p className="text-center text-sm text-text-medium">이동 횟수: {moves}</p>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-2xl font-bold text-success">완성!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div className="flex justify-center">
        <CharacterDdori
          expression={feedback === 'correct' ? 'excited' : moves > 0 ? 'happy' : 'encouraging'}
          size="sm"
          message={selectedPiece !== null ? '교환할 조각을 골라!' : '두 조각을 바꿔봐!'}
        />
      </div>
    </div>
  );
}
