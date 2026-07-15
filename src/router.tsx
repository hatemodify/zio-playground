import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import PageLoading from '@/components/ui/PageLoading';

function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  const LazyComponent = lazy(factory);
  return (
    <Suspense fallback={<PageLoading />}>
      <LazyComponent />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: lazyPage(() => import('./pages/OnboardingPage')),
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: lazyPage(() => import('./pages/HomePage')),
      },
      {
        path: '/numbers',
        element: lazyPage(() => import('./pages/NumbersListPage')),
      },
      {
        path: '/numbers/:id',
        element: lazyPage(() => import('./pages/NumberLearnPage')),
      },
      {
        path: '/hangul',
        element: lazyPage(() => import('./pages/HangulListPage')),
      },
      {
        path: '/hangul/:id',
        element: lazyPage(() => import('./pages/HangulLearnPage')),
      },
      {
        path: '/english',
        element: lazyPage(() => import('./pages/EnglishListPage')),
      },
      {
        path: '/english/:id',
        element: lazyPage(() => import('./pages/EnglishLearnPage')),
      },
      {
        path: '/games',
        element: lazyPage(() => import('./pages/GamesListPage')),
      },
      {
        path: '/games/matching',
        element: lazyPage(() => import('./pages/MatchingGamePage')),
      },
      {
        path: '/games/sorting',
        element: lazyPage(() => import('./pages/SortingGamePage')),
      },
      {
        path: '/games/balloon',
        element: lazyPage(() => import('./pages/BalloonGamePage')),
      },
      {
        path: '/games/coloring',
        element: lazyPage(() => import('./pages/ColoringGamePage')),
      },
      {
        path: '/games/bubble',
        element: lazyPage(() => import('./pages/BubbleGamePage')),
      },
      {
        path: '/games/shadow',
        element: lazyPage(() => import('./pages/ShadowGamePage')),
      },
      {
        path: '/games/word-builder',
        element: lazyPage(() => import('./pages/WordBuilderGamePage')),
      },
      {
        path: '/games/missing-char',
        element: lazyPage(() => import('./pages/MissingCharGamePage')),
      },
      {
        path: '/games/size-compare',
        element: lazyPage(() => import('./pages/SizeCompareGamePage')),
      },
      {
        path: '/games/odd-one-out',
        element: lazyPage(() => import('./pages/OddOneOutGamePage')),
      },
      {
        path: '/games/pattern',
        element: lazyPage(() => import('./pages/PatternGamePage')),
      },
      {
        path: '/games/speed-quiz',
        element: lazyPage(() => import('./pages/SpeedQuizGamePage')),
      },
      {
        path: '/games/memory-sequence',
        element: lazyPage(() => import('./pages/MemorySequenceGamePage')),
      },
      {
        path: '/games/free-draw',
        element: lazyPage(() => import('./pages/FreeDrawGamePage')),
      },
      {
        path: '/games/counting',
        element: lazyPage(() => import('./pages/CountingGamePage')),
      },
      {
        path: '/games/tracing-race',
        element: lazyPage(() => import('./pages/TracingRaceGamePage')),
      },
      {
        path: '/games/puzzle',
        element: lazyPage(() => import('./pages/PuzzleGamePage')),
      },
      {
        path: '/games/connect-dots',
        element: lazyPage(() => import('./pages/ConnectDotsGamePage')),
      },
      {
        path: '/games/whack-a-mole',
        element: lazyPage(() => import('./pages/WhackAMoleGamePage')),
      },
      {
        path: '/games/catch-falling',
        element: lazyPage(() => import('./pages/CatchFallingGamePage')),
      },
      {
        path: '/games/tap-speed',
        element: lazyPage(() => import('./pages/TapSpeedGamePage')),
      },
      {
        path: '/games/addition',
        element: lazyPage(() => import('./pages/AdditionGamePage')),
      },
      {
        path: '/games/number-compare',
        element: lazyPage(() => import('./pages/NumberCompareGamePage')),
      },
      {
        path: '/games/number-order',
        element: lazyPage(() => import('./pages/NumberOrderGamePage')),
      },
      {
        path: '/games/food-stack',
        element: lazyPage(() => import('./pages/FoodStackGamePage')),
      },
      {
        path: '/stickers',
        element: lazyPage(() => import('./pages/StickersPage')),
      },
      {
        path: '/settings',
        element: lazyPage(() => import('./pages/SettingsPage')),
      },
    ],
  },
]);
