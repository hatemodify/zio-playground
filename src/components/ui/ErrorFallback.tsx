import Button from './Button';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export default function ErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg-cream p-8 text-center">
      {/* Sad Ddori placeholder */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="50" r="35" fill="#FFD93D" />
        <circle cx="48" cy="44" r="5" fill="#2D3436" />
        <circle cx="72" cy="44" r="5" fill="#2D3436" />
        <circle cx="48" cy="42" r="1.5" fill="white" />
        <circle cx="72" cy="42" r="1.5" fill="white" />
        <path d="M48 62 Q60 56 72 62" stroke="#2D3436" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="42" cy="35" r="12" fill="#FFD93D" />
        <circle cx="78" cy="35" r="12" fill="#FFD93D" />
        <text x="60" y="105" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#636E72">
          ㅠㅠ
        </text>
      </svg>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-dark">
          앗, 문제가 생겼어요!
        </h2>
        <p className="text-lg text-text-medium">
          걱정 마세요, 다시 시도해볼까요?
        </p>
      </div>

      <Button
        size="xl"
        variant="primary"
        onClick={resetErrorBoundary ?? (() => window.location.reload())}
      >
        다시 시도하기
      </Button>
    </div>
  );
}
