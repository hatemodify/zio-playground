import type { GameId } from '@/types/game';
import type { LearningCategory } from '@/types/learning';

export interface GameDifficultyConfig {
  label: string;
  pairCount?: number;
  itemCount?: number;
  questionCount?: number;
}

export interface GameConfig {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  categories: LearningCategory[];
  difficulties: {
    easy: GameDifficultyConfig;
    normal: GameDifficultyConfig;
    hard: GameDifficultyConfig;
  };
  unlockThreshold: number;
  rules: string[];
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'matching',
    name: '글자-이미지 매칭',
    description: '카드를 뒤집어 같은 짝을 찾아보세요!',
    icon: 'cards',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', pairCount: 4 },
      normal: { label: '보통', pairCount: 6 },
      hard: { label: '어려움', pairCount: 8 },
    },
    unlockThreshold: 0,
    rules: [
      '카드를 터치하면 뒤집어져요',
      '같은 짝을 찾으면 카드가 사라져요',
      '모든 카드를 찾으면 성공!',
    ],
  },
  {
    id: 'quiz',
    name: '소리 퀴즈',
    description: '소리를 듣고 맞는 글자를 찾아보세요!',
    icon: 'speaker',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 10 },
      hard: { label: '어려움', questionCount: 15 },
    },
    unlockThreshold: 0,
    rules: [
      '소리를 잘 들어보세요',
      '3개 중에서 맞는 것을 골라요',
      '틀려도 괜찮아요! 다시 들어볼까요?',
    ],
  },
  {
    id: 'sorting',
    name: '순서 맞추기',
    description: '올바른 순서로 정렬해 보세요!',
    icon: 'sort',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 3 },
      normal: { label: '보통', itemCount: 4 },
      hard: { label: '어려움', itemCount: 5 },
    },
    unlockThreshold: 0,
    rules: [
      '글자를 끌어서 올바른 위치에 놓아요',
      '맞는 자리에 놓으면 초록색으로 변해요',
      '모든 글자를 순서대로 놓으면 성공!',
    ],
  },
  {
    id: 'balloon',
    name: '풍선 터뜨리기',
    description: '맞는 풍선을 찾아 터뜨려 보세요!',
    icon: 'balloon',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 10 },
      hard: { label: '어려움', questionCount: 15 },
    },
    unlockThreshold: 0,
    rules: [
      '소리를 듣고 맞는 풍선을 터뜨려요',
      '풍선이 떠오르면 빨리 찾아보세요',
      '맞으면 풍선이 펑! 하고 터져요',
    ],
  },
  {
    id: 'coloring',
    name: '색칠하기',
    description: '예쁜 색으로 글자를 색칠해 보세요!',
    icon: 'palette',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 1 },
      normal: { label: '보통', itemCount: 2 },
      hard: { label: '어려움', itemCount: 3 },
    },
    unlockThreshold: 0,
    rules: [
      '아래에서 좋아하는 색을 골라요',
      '글자 위를 터치하면 색이 칠해져요',
      '완성하면 갤러리에 저장돼요!',
    ],
  },
  {
    id: 'bubble',
    name: '버블 매칭',
    description: '같은 글자 버블을 찾아 터뜨려 보세요!',
    icon: 'bubbles',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', pairCount: 3 },
      normal: { label: '보통', pairCount: 5 },
      hard: { label: '어려움', pairCount: 7 },
    },
    unlockThreshold: 0,
    rules: [
      '같은 글자가 적힌 버블 2개를 찾아요',
      '연속으로 터치하면 버블이 합쳐져요',
      '힌트 버튼을 누르면 같은 짝이 반짝여요',
    ],
  },
  {
    id: 'shadow',
    name: '그림자 맞추기',
    description: '그림에 맞는 그림자를 찾아보세요!',
    icon: 'shadow',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 12 },
    },
    unlockThreshold: 0,
    rules: [
      '위에 있는 그림을 잘 살펴보세요',
      '아래 그림자 중 맞는 것에 끌어 놓아요',
      '맞추면 글자의 첫소리를 알려줘요!',
    ],
  },
  {
    id: 'word-builder',
    name: '단어 만들기',
    description: '글자를 조합해서 단어를 만들어 보세요!',
    icon: 'blocks',
    categories: ['hangul'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 3 },
      normal: { label: '보통', questionCount: 5 },
      hard: { label: '어려움', questionCount: 8 },
    },
    unlockThreshold: 0,
    rules: [
      '그림을 보고 어떤 단어인지 생각해요',
      '아래 글자 블록을 순서대로 빈칸에 놓아요',
      '완성하면 단어를 읽어줘요!',
    ],
  },
  {
    id: 'missing-char',
    name: '빠진 글자 찾기',
    description: '순서에서 빠진 글자를 찾아보세요!',
    icon: 'puzzle',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 10 },
    },
    unlockThreshold: 0,
    rules: [
      '순서를 잘 살펴보세요',
      '빠진 자리에 들어갈 글자를 골라요',
      '3개 중에서 맞는 것을 찾아보세요!',
    ],
  },
  {
    id: 'size-compare',
    name: '크기 비교',
    description: '어느 쪽이 더 클까요?',
    icon: 'scale',
    categories: ['numbers'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 10 },
    },
    unlockThreshold: 0,
    rules: [
      '두 숫자를 비교해요',
      '더 큰 쪽을 터치해요',
      '그림의 개수를 세어보세요!',
    ],
  },
  {
    id: 'speak',
    name: '따라 말하기',
    description: '소리를 듣고 따라 말해보세요!',
    icon: 'mic',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 10 },
    },
    unlockThreshold: 0,
    rules: [
      '소리를 잘 들어보세요',
      '마이크 버튼을 누르고 따라 말해요',
      '잘했어! 하고 칭찬해 줄게요!',
    ],
  },
  {
    id: 'odd-one-out',
    name: '짝이 아닌 것 찾기',
    description: '다른 하나를 찾아보세요!',
    icon: 'search',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 10 },
    },
    unlockThreshold: 0,
    rules: [
      '4개 중에 하나가 달라요',
      '나머지 셋과 다른 것을 찾아요',
      '잘 보고 터치해 보세요!',
    ],
  },
  {
    id: 'pattern',
    name: '패턴 찾기',
    description: '규칙을 찾아 다음에 올 것을 맞춰보세요!',
    icon: 'pattern',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 10 },
    },
    unlockThreshold: 0,
    rules: [
      '순서를 잘 살펴보세요',
      '규칙을 찾아 다음에 올 것을 골라요',
      '3개 중에서 맞는 것을 찾아보세요!',
    ],
  },
  {
    id: 'speed-quiz',
    name: '빠르기 도전',
    description: '30초 안에 최대한 많이 맞춰보세요!',
    icon: 'timer',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 10 },
      normal: { label: '보통', questionCount: 15 },
      hard: { label: '어려움', questionCount: 20 },
    },
    unlockThreshold: 0,
    rules: [
      '시간이 제한되어 있어요!',
      '맞는 것을 빨리 골라요',
      '최대한 많이 맞추면 별을 많이 받아요!',
    ],
  },
  {
    id: 'memory-sequence',
    name: '순서 기억하기',
    description: '순서를 기억하고 따라해 보세요!',
    icon: 'brain',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 3 },
      normal: { label: '보통', itemCount: 5 },
      hard: { label: '어려움', itemCount: 7 },
    },
    unlockThreshold: 0,
    rules: [
      '글자가 하나씩 나타나요',
      '순서를 잘 기억하세요',
      '기억한 순서대로 터치해 보세요!',
    ],
  },
  {
    id: 'free-draw',
    name: '자유 그리기',
    description: '마음껏 그림을 그려보세요!',
    icon: 'pencil',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 1 },
      normal: { label: '보통', itemCount: 1 },
      hard: { label: '어려움', itemCount: 1 },
    },
    unlockThreshold: 0,
    rules: [
      '좋아하는 색을 골라요',
      '손가락으로 자유롭게 그려요',
      '완성하면 별을 받아요!',
    ],
  },
  {
    id: 'counting',
    name: '숫자 세기',
    description: '그림을 세어 맞는 숫자를 골라보세요!',
    icon: 'hash',
    categories: ['numbers'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 5 },
      normal: { label: '보통', questionCount: 8 },
      hard: { label: '어려움', questionCount: 12 },
    },
    unlockThreshold: 0,
    rules: [
      '화면에 나타난 그림을 세어보세요',
      '맞는 숫자를 골라요',
      '빨리 맞출수록 별을 많이 받아요!',
    ],
  },
  {
    id: 'tracing-race',
    name: '따라쓰기 경주',
    description: '시간 안에 글자를 빠르게 따라 써보세요!',
    icon: 'pen',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', questionCount: 3 },
      normal: { label: '보통', questionCount: 5 },
      hard: { label: '어려움', questionCount: 8 },
    },
    unlockThreshold: 0,
    rules: [
      '화면에 나타난 글자를 따라 써요',
      '제한 시간 안에 완성하세요',
      '정확하게 쓸수록 별을 많이 받아요!',
    ],
  },
  {
    id: 'puzzle',
    name: '퍼즐 맞추기',
    description: '조각을 맞춰 그림을 완성해보세요!',
    icon: 'grid',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 4 },
      normal: { label: '보통', itemCount: 6 },
      hard: { label: '어려움', itemCount: 9 },
    },
    unlockThreshold: 0,
    rules: [
      '퍼즐 조각을 올바른 위치에 놓아요',
      '모든 조각을 맞추면 그림이 완성돼요',
      '적은 횟수로 맞출수록 별을 많이 받아요!',
    ],
  },
  {
    id: 'connect-dots',
    name: '점 잇기',
    description: '순서대로 점을 이어 그림을 완성해보세요!',
    icon: 'link',
    categories: ['numbers', 'hangul', 'english'],
    difficulties: {
      easy: { label: '쉬움', itemCount: 5 },
      normal: { label: '보통', itemCount: 8 },
      hard: { label: '어려움', itemCount: 12 },
    },
    unlockThreshold: 0,
    rules: [
      '순서대로 점을 터치해요',
      '올바른 순서로 이으면 그림이 나타나요',
      '틀리지 않고 이으면 별을 많이 받아요!',
    ],
  },
  {
    id: 'whack-a-mole',
    name: '두더지 잡기',
    description: '튀어나오는 탈것을 빠르게 터치하세요!',
    icon: 'target',
    categories: [],
    difficulties: {
      easy: { label: '쉬움', questionCount: 15 },
      normal: { label: '보통', questionCount: 25 },
      hard: { label: '어려움', questionCount: 35 },
    },
    unlockThreshold: 0,
    rules: [
      '구멍에서 탈것이 튀어나와요',
      '빠르게 터치하면 점수를 받아요',
      '폭탄은 피하세요!',
    ],
  },
  {
    id: 'catch-falling',
    name: '별 잡기',
    description: '하늘에서 떨어지는 별을 바구니로 받아보세요!',
    icon: 'star',
    categories: [],
    difficulties: {
      easy: { label: '쉬움', questionCount: 15 },
      normal: { label: '보통', questionCount: 25 },
      hard: { label: '어려움', questionCount: 40 },
    },
    unlockThreshold: 0,
    rules: [
      '바구니를 좌우로 움직여요',
      '별과 하트를 받으면 점수를 받아요',
      '폭탄은 피하세요!',
    ],
  },
  {
    id: 'tap-speed',
    name: '빠른 손',
    description: '10초 안에 최대한 많이 터치하세요!',
    icon: 'hand',
    categories: [],
    difficulties: {
      easy: { label: '쉬움', questionCount: 20 },
      normal: { label: '보통', questionCount: 30 },
      hard: { label: '어려움', questionCount: 40 },
    },
    unlockThreshold: 0,
    rules: [
      '큰 버튼을 빠르게 터치해요',
      '10초 안에 최대한 많이!',
      '이전 기록에 도전해 보세요!',
    ],
  },
];

export function getGameConfig(gameId: GameId): GameConfig | undefined {
  return GAME_CONFIGS.find((g) => g.id === gameId);
}

export function getAvailableGamesForCategory(category: LearningCategory): GameConfig[] {
  return GAME_CONFIGS.filter((g) => g.categories.includes(category));
}
