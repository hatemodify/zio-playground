import { Component, useEffect, useRef, type ReactNode, type ErrorInfo } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ErrorFallback from './ErrorFallback';
import { useSession } from '@/hooks/use-session';
import { useLandscapeTablet } from '@/hooks/use-media-query';
import { soundManager } from '@/lib/sound-manager';
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

  // Global iOS unlock for TTS + AudioContext
  const unlockedRef = useRef(false);
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      // TTS unlock — play silent utterance (use space, not empty string for iOS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(' ');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }

      // AudioContext unlock
      soundManager.unlock();

      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh bg-bg-cream',
        isLandscape ? 'max-w-none flex-row' : 'max-w-[1024px] flex-col',
      )}
    >
      {!isLandscape && <TopBar />}
      {isLandscape && <BottomNav landscape />}
      <main className="flex-1 overflow-y-auto">
        {isLandscape && <TopBar compact />}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      {!isLandscape && <BottomNav />}
    </div>
  );
}
