import { Component, useEffect, useRef, type ReactNode, type ErrorInfo } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ErrorFallback from './ErrorFallback';
import { useSession } from '@/hooks/use-session';
import { useLandscapeTablet } from '@/hooks/use-media-query';
import { soundManager } from '@/lib/sound-manager';
import { primeSpeech } from '@/lib/tts-utils';
import { cn } from '@/lib/cn';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error ?? undefined}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }
    return this.props.children;
  }
}

export default function AppLayout() {
  useSession();
  const isLandscape = useLandscapeTablet();

  // iOS Safari and Android WebViews keep speech and audio muted until each is
  // started from a real user gesture. Spend the app's first tap on both.
  const unlockedRef = useRef(false);
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      primeSpeech();
      soundManager.unlock();

      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('pointerdown', unlock);
    document.addEventListener('touchstart', unlock);
    document.addEventListener('click', unlock);

    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  return (
    <div
      className={cn(
        // h-dvh, not min-h-dvh: <main> needs a definite height, otherwise a child
        // sized from its parent (the drawing canvas) and a parent sized from its
        // child grow each other without bound. Long pages scroll inside <main>.
        'mx-auto flex h-dvh bg-bg-cream',
        isLandscape ? 'max-w-none flex-row' : 'max-w-[1024px] flex-col',
      )}
    >
      {!isLandscape && <TopBar />}
      {isLandscape && <BottomNav landscape />}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {isLandscape && <TopBar compact />}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      {!isLandscape && <BottomNav />}
    </div>
  );
}
