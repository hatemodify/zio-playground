import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface ParentGateProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function generateQuestion(): { a: number; b: number; answer: number } {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

const NUM_PAD_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;

export default function ParentGate({ open, onSuccess, onCancel }: ParentGateProps) {
  const [question, setQuestion] = useState(generateQuestion);
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);

  const maxAttempts = 3;

  const handleNumPress = useCallback(
    (num: number) => {
      if (input.length >= 2) return;

      const newInput = input + String(num);
      setInput(newInput);
      setError(false);

      // Check answer when 2 digits entered or if answer is single digit and matches
      const numericInput = parseInt(newInput, 10);
      if (
        newInput.length === String(question.answer).length ||
        newInput.length >= 2
      ) {
        if (numericInput === question.answer) {
          onSuccess();
          // Reset state for next open
          setInput('');
          setAttempts(0);
          setQuestion(generateQuestion());
        } else {
          setError(true);
          setAttempts((prev) => prev + 1);
          setTimeout(() => {
            setInput('');
            setError(false);
            if (attempts + 1 >= maxAttempts) {
              onCancel();
              setAttempts(0);
              setQuestion(generateQuestion());
            } else {
              setQuestion(generateQuestion());
            }
          }, 800);
        }
      }
    },
    [input, question, attempts, onSuccess, onCancel],
  );

  const handleDelete = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const remainingAttempts = maxAttempts - attempts;

  const numPadLayout = useMemo(
    () => [
      NUM_PAD_KEYS.slice(0, 3),
      NUM_PAD_KEYS.slice(3, 6),
      NUM_PAD_KEYS.slice(6, 9),
    ],
    [],
  );

  return (
    <Modal open={open} onClose={onCancel} title="부모 확인" showCloseButton>
      <div className="flex flex-col items-center gap-5">
        {/* Description */}
        <p className="text-center text-sm text-text-medium">
          설정에 접근하려면 아래 문제를 풀어주세요
        </p>

        {/* Question */}
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl font-bold text-text-dark">
            {question.a}
          </span>
          <span className="font-display text-3xl font-bold text-text-medium">
            +
          </span>
          <span className="font-display text-4xl font-bold text-text-dark">
            {question.b}
          </span>
          <span className="font-display text-3xl font-bold text-text-medium">
            =
          </span>

          {/* Input display */}
          <motion.div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-radius-lg border-2',
              'font-display text-3xl font-bold',
              error
                ? 'border-error bg-error/10 text-error'
                : input
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-text-light bg-bg-warm text-text-light',
            )}
            animate={error ? { x: [-4, 4, -4, 4, 0] } : undefined}
            transition={{ duration: 0.4 }}
          >
            {input || '?'}
          </motion.div>
        </div>

        {/* Attempts remaining */}
        <p className="text-xs text-text-light">
          남은 시도: {remainingAttempts}회
        </p>

        {/* Number pad */}
        <div className="flex flex-col gap-2">
          {numPadLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((num) => (
                <Button
                  key={num}
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 !px-0 font-display text-xl font-bold"
                  onClick={() => handleNumPress(num)}
                  disabled={error}
                >
                  {num}
                </Button>
              ))}
            </div>
          ))}
          {/* Bottom row: empty, 0, delete */}
          <div className="flex gap-2">
            <div className="h-14 w-14" />
            <Button
              variant="secondary"
              size="lg"
              className="h-14 w-14 !px-0 font-display text-xl font-bold"
              onClick={() => handleNumPress(0)}
              disabled={error}
            >
              0
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14 w-14 !px-0"
              onClick={handleDelete}
              disabled={error || input.length === 0}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L3 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
