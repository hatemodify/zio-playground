import { ANIMALS, FOODS, VEHICLES, picturesForTheme, shuffled, type PictureId, type PictureTheme } from './picture-content';
import type { Difficulty } from '@/components/games/AdventureFrame';

export const DISCOVERY_GAMES = {
  'vehicle-missions': { title: '출동! 탈것 마을', subtitle: '어떤 일을 하는 탈것인지 그림으로 알아봐요', picture: 'excavator', objective: '탈것의 역할 · 관찰', instructions: ['마을에 필요한 일을 살펴봐요.', '그림자를 보고 그 일을 할 수 있는 탈것을 골라요.', '경찰차부터 중장비까지 각자의 역할을 알아봐요.'] },
  'little-market': { title: '꼬마 장보기', subtitle: '담고 빼면서 수량과 덧셈을 배워요', picture: 'apple', objective: '수량 · 덧셈', instructions: ['주문서의 그림과 숫자를 살펴봐요.', '물건을 눌러 바구니에 담고, 바구니를 누르면 뺄 수 있어요.', '주문한 수만큼 담은 뒤 확인해요.'] },
  'animal-families': { title: '동물 탐험대', subtitle: '닮은 특징을 찾아 동물을 분류해요', picture: 'penguin', objective: '관찰 · 분류', instructions: ['동물 그림을 자세히 관찰해요.', '함께 지낼 동물 무리를 골라요.', '동물마다 어떤 특징이 있는지 알아봐요.'] },
  'picture-words': { title: '그림 단어 공방', subtitle: '조각을 이어 한글과 영어 단어를 만들어요', picture: 'police-car', objective: '한글 · 영어', instructions: ['그림을 보고 무엇인지 생각해요.', '글자 조각을 순서대로 눌러 단어를 만들어요.', '잘못 놓은 조각은 한 칸 지우기로 다시 골라요.'] },
  'pattern-garden': { title: '규칙 정원', subtitle: '반복되는 순서를 관찰하고 다음 그림을 찾아요', picture: 'dump-truck', objective: '규칙 · 추론', instructions: ['그림이 어떤 순서로 이어지는지 봐요.', '반복되는 묶음을 찾아요.', '물음표 자리에 올 그림을 골라요.'] },
} as const;
export type DiscoveryId = keyof typeof DISCOVERY_GAMES;
export interface DiscoveryQuestion {
  picture: PictureId;
  name: string;
  answer: string;
  explanation: string;
  hint?: string;
  choices: { value: string; label: string; picture?: PictureId }[];
  sequence?: PictureId[];
  unit?: PictureId[];
  left?: number;
  right?: number;
  word?: string;
  tokens?: { id: number; value: string }[];
}
export function createDiscoveryQuestions(mode: DiscoveryId, difficulty: Difficulty, language: 'ko' | 'en', theme: PictureTheme = 'all'): DiscoveryQuestion[] {
  const count = difficulty === 'easy' ? 6 : difficulty === 'normal' ? 8 : 10;
  const animals = shuffled(ANIMALS);
  const foods = shuffled(FOODS);
  const vehicles = shuffled(VEHICLES);
  const pool = picturesForTheme(theme);
  const words = shuffled(pool.filter((word) => difficulty !== 'easy' || (language === 'ko' ? word.name.length <= 3 : word.english.length <= 4)));
  return Array.from({ length: count }, (_, i) => {
    if (mode === 'vehicle-missions') {
      const vehicle = vehicles[i % vehicles.length];
      const choices = shuffled([vehicle, ...shuffled(VEHICLES.filter((item) => item.id !== vehicle.id)).slice(0, difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3)]);
      return { picture: vehicle.id, name: vehicle.name, answer: vehicle.id, hint: vehicle.job, choices: choices.map((item) => ({ value: item.id, label: item.name, picture: item.id })), explanation: `${vehicle.name}: ${vehicle.job}` };
    }
    if (mode === 'little-market') {
      const food = foods[i % foods.length];
      const left = difficulty === 'easy' ? 1 + i % 5 : 2 + i % 4;
      const right = difficulty === 'hard' ? 1 + i % 5 : difficulty === 'normal' ? 1 + i % 3 : 0;
      return { picture: food.id, name: food.name, left, right, answer: String(left + right), choices: [],
        explanation: right ? `${left}개와 ${right}개를 합치면 ${left + right}개예요. ${left} + ${right} = ${left + right}` : `${food.name}를 하나씩 세면 ${left}개예요!` };
    }
    if (mode === 'animal-families') {
      const animal = animals[i % animals.length];
      const groups = [{ value: '포유류', label: '새끼에게 젖을 먹여요', picture: 'rabbit' as const }, { value: '새', label: '깃털과 부리가 있어요', picture: 'parrot' as const }, { value: '파충류', label: '몸에 비늘이 있어요', picture: 'snake' as const }];
      const choices = difficulty === 'easy' ? [groups.find((g) => g.value === animal.group)!, ...shuffled(groups.filter((g) => g.value !== animal.group)).slice(0, 1)] : groups;
      return { picture: animal.id, name: animal.name, answer: animal.group, choices: shuffled(choices), hint: animal.fact, explanation: `${animal.fact} ${animal.name}는 ${animal.group}에 속해요.` };
    }
    if (mode === 'picture-words') {
      const item = words[i % words.length];
      const word = (language === 'ko' ? item.name : item.english.toUpperCase()).replace(/\s/g, '');
      const extra = difficulty === 'hard' ? (language === 'ko' ? ['가', '나'] : ['X', 'Z']) : [];
      return { picture: item.id, name: item.name, word, answer: word, choices: [],
        tokens: shuffled([...word, ...extra].map((value, id) => ({ value, id }))),
        explanation: `${item.name} · ${item.english} — ${[...word].join(' → ')} 순서로 이어요.` };
    }
    const friends = shuffled(pool).slice(0, 3).map((animal) => animal.id);
    const unit: PictureId[] = difficulty === 'easy' ? friends.slice(0, 2) : difficulty === 'normal' ? [friends[0], friends[1], friends[1]] : (i % 2 ? friends : [friends[0], friends[0], friends[1], friends[1]]);
    const sequence = Array.from({ length: unit.length * 2 + (difficulty === 'easy' ? 0 : i % unit.length) }, (_, index) => unit[index % unit.length]);
    const answer = unit[sequence.length % unit.length];
    return { picture: friends[0], name: '규칙', answer, sequence, unit,
      choices: shuffled(friends).map((id) => ({ value: id, label: pool.find((item) => item.id === id)!.name, picture: id })),
      explanation: `${unit.map((id) => pool.find((item) => item.id === id)!.name).join(' → ')} 순서가 반복돼요.` };
  });
}
