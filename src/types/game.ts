import type { LearningCategory } from './learning';

export type GameId =
  | 'matching'
  | 'quiz'
  | 'sorting'
  | 'balloon'
  | 'coloring'
  | 'bubble'
  | 'shadow'
  | 'word-builder'
  | 'missing-char'
  | 'size-compare'
  | 'speak'
  | 'odd-one-out'
  | 'pattern'
  | 'speed-quiz'
  | 'memory-sequence'
  | 'free-draw'
  | 'counting'
  | 'tracing-race'
  | 'puzzle'
  | 'connect-dots'
  | 'whack-a-mole'
  | 'catch-falling'
  | 'tap-speed'
  | 'addition'
  | 'number-compare'
  | 'number-order'
  | 'food-stack';

export type GameState = 'ready' | 'playing' | 'success' | 'fail' | 'reward';

export interface GameRecord {
  gameId: GameId;
  category: LearningCategory;
  score: number;
  stars: number; // 1-3
  completedAt: string;
  duration: number; // seconds
}

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  path: string;
  unlockThreshold: number; // category progress % required
}

export const GAMES: GameInfo[] = [
  {
    id: 'matching',
    name: '글자-이미지 매칭',
    description: '카드를 뒤집어 같은 짝을 찾아보세요!',
    path: '/games/matching',
    unlockThreshold: 0,
  },
  {
    id: 'sorting',
    name: '순서 맞추기',
    description: '올바른 순서로 정렬해보세요!',
    path: '/games/sorting',
    unlockThreshold: 0,
  },
  {
    id: 'balloon',
    name: '풍선 터뜨리기',
    description: '맞는 풍선을 찾아 터뜨려보세요!',
    path: '/games/balloon',
    unlockThreshold: 0,
  },
  {
    id: 'coloring',
    name: '색칠하기',
    description: '예쁜 색으로 칠해보세요!',
    path: '/games/coloring',
    unlockThreshold: 0,
  },
  {
    id: 'bubble',
    name: '버블 매칭',
    description: '같은 버블끼리 짝지어보세요!',
    path: '/games/bubble',
    unlockThreshold: 0,
  },
  {
    id: 'shadow',
    name: '그림자 맞추기',
    description: '그림자의 주인을 찾아보세요!',
    path: '/games/shadow',
    unlockThreshold: 0,
  },
  {
    id: 'word-builder',
    name: '단어 만들기',
    description: '글자를 모아 단어를 완성해보세요!',
    path: '/games/word-builder',
    unlockThreshold: 0,
  },
  {
    id: 'missing-char',
    name: '빠진 글자 찾기',
    description: '순서에서 빠진 글자를 찾아보세요!',
    path: '/games/missing-char',
    unlockThreshold: 0,
  },
  {
    id: 'size-compare',
    name: '크기 비교',
    description: '어느 쪽이 더 클까요?',
    path: '/games/size-compare',
    unlockThreshold: 0,
  },
  {
    id: 'odd-one-out',
    name: '짝이 아닌 것 찾기',
    description: '다른 하나를 찾아보세요!',
    path: '/games/odd-one-out',
    unlockThreshold: 0,
  },
  {
    id: 'pattern',
    name: '패턴 찾기',
    description: '규칙을 찾아 다음을 맞춰보세요!',
    path: '/games/pattern',
    unlockThreshold: 0,
  },
  {
    id: 'speed-quiz',
    name: '빠르기 도전',
    description: '시간 안에 많이 맞춰보세요!',
    path: '/games/speed-quiz',
    unlockThreshold: 0,
  },
  {
    id: 'memory-sequence',
    name: '순서 기억하기',
    description: '순서를 기억하고 따라해 보세요!',
    path: '/games/memory-sequence',
    unlockThreshold: 0,
  },
  {
    id: 'free-draw',
    name: '자유 그리기',
    description: '마음껏 그림을 그려보세요!',
    path: '/games/free-draw',
    unlockThreshold: 0,
  },
  {
    id: 'counting',
    name: '숫자 세기',
    description: '그림을 세어 맞는 숫자를 골라보세요!',
    path: '/games/counting',
    unlockThreshold: 0,
  },
  {
    id: 'tracing-race',
    name: '따라쓰기 경주',
    description: '시간 안에 글자를 빠르게 따라 써보세요!',
    path: '/games/tracing-race',
    unlockThreshold: 0,
  },
  {
    id: 'puzzle',
    name: '퍼즐 맞추기',
    description: '조각을 맞춰 그림을 완성해보세요!',
    path: '/games/puzzle',
    unlockThreshold: 0,
  },
  {
    id: 'connect-dots',
    name: '점 잇기',
    description: '순서대로 점을 이어 그림을 완성해보세요!',
    path: '/games/connect-dots',
    unlockThreshold: 0,
  },
  {
    id: 'whack-a-mole',
    name: '두더지 잡기',
    description: '튀어나오는 탈것을 빠르게 터치하세요!',
    path: '/games/whack-a-mole',
    unlockThreshold: 0,
  },
  {
    id: 'catch-falling',
    name: '별 잡기',
    description: '떨어지는 별을 바구니로 받아보세요!',
    path: '/games/catch-falling',
    unlockThreshold: 0,
  },
  {
    id: 'tap-speed',
    name: '빠른 손',
    description: '10초 안에 최대한 많이 터치하세요!',
    path: '/games/tap-speed',
    unlockThreshold: 0,
  },
  {
    id: 'addition',
    name: '더하기 놀이',
    description: '두 수를 더하면 얼마일까요?',
    path: '/games/addition',
    unlockThreshold: 0,
  },
  {
    id: 'number-compare',
    name: '큰 수 찾기',
    description: '어느 숫자가 더 클까요?',
    path: '/games/number-compare',
    unlockThreshold: 0,
  },
  {
    id: 'number-order',
    name: '숫자 이어세기',
    description: '빈칸에 들어갈 숫자를 찾아보세요!',
    path: '/games/number-order',
    unlockThreshold: 0,
  },
  {
    id: 'food-stack',
    name: '음식 만들기',
    description: '예시와 똑같은 순서로 재료를 쌓아보세요!',
    path: '/games/food-stack',
    unlockThreshold: 0,
  },
] as const;
