import { ANIMALS, FOODS, VEHICLES, PICTURE_WORDS, TWEMOJI_PICTURES, hasPicture, pictureName, picturesForTheme, shuffled, type PictureId, type PictureTheme } from './picture-content';
import { HANGUL_CONSONANTS, HANGUL_VOWELS, SYLLABLE_WORDS, initialConsonantOf } from './hangul';
import { ENGLISH_DATA } from './english';
import type { Difficulty } from '@/components/games/AdventureFrame';

export const DISCOVERY_GAMES = {
  'vehicle-missions': { title: '출동! 탈것 마을', subtitle: '어떤 일을 하는 탈것인지 그림으로 알아봐요', picture: 'excavator', objective: '탈것의 역할 · 관찰', instructions: ['마을에 필요한 일을 살펴봐요.', '그림자를 보고 그 일을 할 수 있는 탈것을 골라요.', '경찰차부터 중장비까지 각자의 역할을 알아봐요.'] },
  'little-market': { title: '꼬마 장보기', subtitle: '담고 빼면서 수량과 덧셈을 배워요', picture: 'apple', objective: '수량 · 덧셈', instructions: ['주문서의 그림과 숫자를 살펴봐요.', '물건을 눌러 바구니에 담고, 바구니를 누르면 뺄 수 있어요.', '주문한 수만큼 담은 뒤 확인해요.'] },
  'animal-families': { title: '동물 탐험대', subtitle: '닮은 특징을 찾아 동물을 분류해요', picture: 'penguin', objective: '관찰 · 분류', instructions: ['동물 그림을 자세히 관찰해요.', '함께 지낼 동물 무리를 골라요.', '동물마다 어떤 특징이 있는지 알아봐요.'] },
  'picture-words': { title: '그림 단어 공방', subtitle: '조각을 이어 한글과 영어 단어를 만들어요', picture: 'police-car', objective: '한글 · 영어', instructions: ['그림을 보고 무엇인지 생각해요.', '글자 조각을 순서대로 눌러 단어를 만들어요.', '잘못 놓은 조각은 한 칸 지우기로 다시 골라요.'] },
  'pattern-garden': { title: '규칙 정원', subtitle: '반복되는 순서를 관찰하고 다음 그림을 찾아요', picture: 'dump-truck', objective: '규칙 · 추론', instructions: ['그림이 어떤 순서로 이어지는지 봐요.', '반복되는 묶음을 찾아요.', '물음표 자리에 올 그림을 골라요.'] },
  'word-pictures': { title: '글자 보고 그림 찾기', subtitle: '단어를 읽고 맞는 그림을 골라요', picture: 'rabbit', objective: '읽기 · 단어', instructions: ['큰 글씨로 적힌 단어를 천천히 읽어요.', '단어와 맞는 그림을 골라요.', '한글과 영어 중에 골라서 놀 수 있어요.'] },
  'first-sound': { title: '첫소리 찾기', subtitle: '글자로 시작하는 그림을 찾아요', picture: 'giraffe', objective: '첫소리 · 음운 인식', instructions: ['가운데 글자를 보고 소리를 떠올려요.', '그 소리로 시작하는 그림을 골라요.', '한글 자음과 영어 알파벳 모두 연습해요.'] },
  'position-words': { title: '어디에 있을까?', subtitle: '위·아래·안·밖, 자리를 말하는 말을 배워요', picture: 'bear', objective: '위치 · 공간 어휘', instructions: ['상자와 동물 친구를 잘 살펴봐요.', '동물이 어디에 있는지 말을 골라요.', '어려운 단계에서는 말을 보고 맞는 그림을 찾아요.'] },
  'daily-routine': { title: '생활 순서 놀이', subtitle: '손 씻기·양치처럼 하루 일을 순서대로 놓아요', picture: 'toothbrush', objective: '순서 · 생활 습관', instructions: ['어떤 일을 하는지 제목을 읽어요.', '먼저 하는 일부터 차례대로 그림을 눌러요.', '틀리면 다시 생각해서 골라요.'] },
} as const;
export type DiscoveryId = keyof typeof DISCOVERY_GAMES;
/** Where the animal sits relative to the box in 어디에 있을까?. */
export type Position = '위' | '아래' | '안' | '앞' | '뒤' | '옆';
export const POSITIONS: Position[] = ['위', '아래', '안', '앞', '뒤', '옆'];
export interface DiscoveryQuestion {
  picture: PictureId;
  name: string;
  answer: string;
  explanation: string;
  hint?: string;
  choices: { value: string; label: string; picture?: PictureId; place?: Position }[];
  sequence?: PictureId[];
  unit?: PictureId[];
  left?: number;
  right?: number;
  word?: string;
  tokens?: { id: number; value: string }[];
  /** Big text the child reads: a word, a first sound, or a position word. */
  prompt?: string;
  place?: Position;
  /** 생활 순서 steps in the right order, and the shuffled order they are laid out in. */
  steps?: { picture: PictureId; label: string }[];
  layout?: number[];
}
export function createDiscoveryQuestions(mode: DiscoveryId, difficulty: Difficulty, language: 'ko' | 'en', theme: PictureTheme = 'all'): DiscoveryQuestion[] {
  const count = difficulty === 'easy' ? 6 : difficulty === 'normal' ? 8 : 10;
  if (mode === 'word-pictures') return wordPictureQuestions(difficulty, language, count);
  if (mode === 'first-sound') return firstSoundQuestions(difficulty, language, count);
  if (mode === 'position-words') return positionQuestions(difficulty, count);
  if (mode === 'daily-routine') return routineQuestions(difficulty, count);
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

interface ReadingWord { word: string; picture: PictureId }
// Heavy machinery names (굴착기, 레미콘…) are a stretch for a first reader.
const EVERYDAY_PICTURES = PICTURE_WORDS.filter((item) => !('job' in item) || item.group !== '중장비');
/**
 * Every word a child can read and match to a picture we ship. Korean words
 * must be the picture's own name, so "겨울" on a snowman never asks the child
 * to read one thing and name another.
 */
function readingWords(language: 'ko' | 'en'): ReadingWord[] {
  const seen = new Set<string>();
  const result: ReadingWord[] = [];
  const add = (word: string, picture: string) => {
    const key = `${word.toLowerCase()}|${picture}`;
    if (!hasPicture(picture) || seen.has(key) || /\s/.test(word)) return;
    if (language === 'ko' && pictureName(picture) !== word) return;
    seen.add(key); result.push({ word, picture });
  };
  if (language === 'ko') {
    for (const [, item] of Object.entries(SYLLABLE_WORDS)) add(item.word, item.image);
    for (const item of [...HANGUL_CONSONANTS, ...HANGUL_VOWELS]) add(item.representativeWord, item.wordImage);
    for (const item of EVERYDAY_PICTURES) add(item.name, item.id);
  } else {
    for (const item of ENGLISH_DATA) add(item.word, item.wordImage);
    for (const item of EVERYDAY_PICTURES) add(item.english, item.id);
    for (const [id, item] of Object.entries(TWEMOJI_PICTURES)) add(item.english, id);
  }
  return result;
}
/** First sound of a word: the basic initial consonant in Korean, the capital letter in English. */
function firstSound(word: string, language: 'ko' | 'en'): string {
  return language === 'ko' ? initialConsonantOf(word[0]) : word[0].toUpperCase();
}
const CONSONANT_NAMES = Object.fromEntries(HANGUL_CONSONANTS.map((item) => [item.character, item.name]));
function hasBatchim(name: string): boolean {
  const code = name.charCodeAt(name.length - 1) - 0xAC00;
  return code >= 0 && code < 11172 && code % 28 !== 0;
}
/** Korean topic particle: 토끼는, 곰은. */
const topic = (name: string) => hasBatchim(name) ? '은' : '는';
/** Korean copula: 토끼예요, 곰이에요. */
const copula = (name: string) => hasBatchim(name) ? '이에요' : '예요';
const SHORT_WORD = { ko: 3, en: 5 };
function wordPictureQuestions(difficulty: Difficulty, language: 'ko' | 'en', count: number): DiscoveryQuestion[] {
  const pool = readingWords(language);
  const targets = shuffled(pool.filter((item) => difficulty !== 'easy' || item.word.length <= SHORT_WORD[language]));
  return Array.from({ length: count }, (_, i) => {
    const target = targets[i % targets.length];
    const others = pool.filter((item) => item.word.toLowerCase() !== target.word.toLowerCase() && item.picture !== target.picture);
    // 자신 있어요: one distractor that starts the same way, so the whole word has to be read.
    const lookalike = difficulty === 'hard' ? shuffled(others.filter((item) => firstSound(item.word, language) === firstSound(target.word, language))).slice(0, 1) : [];
    const rest = shuffled(others.filter((item) => !lookalike.includes(item)));
    const distractors = [...lookalike, ...rest].slice(0, difficulty === 'easy' ? 2 : 3);
    return { picture: target.picture, name: target.word, prompt: target.word, word: target.word, answer: target.picture,
      choices: shuffled([target, ...distractors]).map((item) => ({ value: item.picture, label: item.word, picture: item.picture })),
      explanation: language === 'ko' ? `${target.word} — 글자를 읽고 그림을 찾았어요.` : `${target.word} — ${pictureName(target.picture)}${copula(pictureName(target.picture))}.` };
  });
}
function firstSoundQuestions(difficulty: Difficulty, language: 'ko' | 'en', count: number): DiscoveryQuestion[] {
  const pool = readingWords(language);
  const bySound = new Map<string, ReadingWord[]>();
  for (const item of pool) bySound.set(firstSound(item.word, language), [...(bySound.get(firstSound(item.word, language)) ?? []), item]);
  const sounds = shuffled([...bySound.keys()]);
  return Array.from({ length: count }, (_, i) => {
    const sound = sounds[i % sounds.length];
    const target = shuffled(bySound.get(sound)!)[0];
    const distractors: ReadingWord[] = [];
    for (const item of shuffled(pool)) {
      if (distractors.length === (difficulty === 'easy' ? 2 : 3)) break;
      const itemSound = firstSound(item.word, language);
      if (itemSound !== sound && item.picture !== target.picture && !distractors.some((picked) => firstSound(picked.word, language) === itemSound)) distractors.push(item);
    }
    const hint = language === 'ko' ? CONSONANT_NAMES[sound] ?? sound : sound.toLowerCase();
    return { picture: target.picture, name: target.word, prompt: sound, hint, word: target.word, answer: target.picture,
      choices: shuffled([target, ...distractors]).map((item) => ({ value: item.picture, label: item.word, picture: item.picture })),
      explanation: language === 'ko' ? `${target.word}${topic(target.word)} ${sound}(${hint})으로 시작해요.` : `${target.word}${topic(target.word)} ${sound}로 시작해요.` };
  });
}
const POSITION_ANIMALS: PictureId[] = ['rabbit', 'bear', 'dog', 'cat', 'duck', 'fox', 'panda', 'penguin', 'pig', 'koala'];
function positionQuestions(difficulty: Difficulty, count: number): DiscoveryQuestion[] {
  const animals = shuffled(POSITION_ANIMALS);
  const places = shuffled(POSITIONS);
  return Array.from({ length: count }, (_, i) => {
    const animal = animals[i % animals.length];
    const name = pictureName(animal);
    const place = places[i % places.length];
    const others = shuffled(POSITIONS.filter((item) => item !== place)).slice(0, difficulty === 'normal' ? 3 : 2);
    return { picture: animal, name, place, answer: place, hint: `${name}${topic(name)} 상자`,
      prompt: difficulty === 'hard' ? place : `${name}${topic(name)} 상자 어디에 있을까요?`,
      choices: shuffled([place, ...others]).map((item) => ({ value: item, label: item, place: item })),
      explanation: `${name}${topic(name)} 상자 ${place}에 있어요.` };
  });
}
const ROUTINES: { title: string; steps: { picture: PictureId; label: string }[] }[] = [
  { title: '손 씻기', steps: [{ picture: 'faucet', label: '물 틀기' }, { picture: 'soap', label: '비누 칠하기' }, { picture: 'bubbles', label: '거품 내기' }, { picture: 'droplet', label: '물로 헹구기' }, { picture: 'toilet-paper', label: '손 닦기' }] },
  { title: '이 닦기', steps: [{ picture: 'toothbrush', label: '칫솔 들기' }, { picture: 'grin', label: '이 닦기' }, { picture: 'droplet', label: '물로 헹구기' }, { picture: 'sparkles', label: '반짝반짝' }] },
  { title: '잠자리 준비', steps: [{ picture: 'bathtub', label: '목욕하기' }, { picture: 't-shirt', label: '잠옷 입기' }, { picture: 'book', label: '책 읽기' }, { picture: 'bed', label: '잠자기' }] },
  { title: '아침 등원', steps: [{ picture: 'alarm-clock', label: '일어나기' }, { picture: 'bowl', label: '아침 먹기' }, { picture: 't-shirt', label: '옷 입기' }, { picture: 'backpack', label: '가방 메기' }, { picture: 'school', label: '유치원 가기' }] },
  { title: '씨앗 키우기', steps: [{ picture: 'beans', label: '씨앗 심기' }, { picture: 'droplet', label: '물 주기' }, { picture: 'seedling', label: '새싹이 쏙' }, { picture: 'sunflower', label: '꽃이 활짝' }] },
  { title: '비 오는 날', steps: [{ picture: 'cloud', label: '구름이 모여요' }, { picture: 'rain-cloud', label: '비가 내려요' }, { picture: 'umbrella-rain', label: '우산을 써요' }, { picture: 'rainbow', label: '무지개가 떠요' }] },
  { title: '눈사람 만들기', steps: [{ picture: 'snow-cloud', label: '눈이 내려요' }, { picture: 'white-circle', label: '눈을 뭉쳐요' }, { picture: 'snowman', label: '눈사람 완성' }] },
];
function routineQuestions(difficulty: Difficulty, count: number): DiscoveryQuestion[] {
  const routines = shuffled(ROUTINES);
  return Array.from({ length: count }, (_, i) => {
    const routine = routines[i % routines.length];
    const steps = routine.steps.slice(0, difficulty === 'easy' ? 3 : difficulty === 'normal' ? 4 : routine.steps.length);
    let layout = shuffled(steps.map((_, index) => index));
    while (layout.every((value, index) => value === index)) layout = shuffled(layout);
    return { picture: steps[steps.length - 1].picture, name: routine.title, steps, layout, answer: 'done', choices: [],
      prompt: `${routine.title}${topic(routine.title)} 어떤 순서일까요?`,
      explanation: `${routine.title}: ${steps.map((step) => step.label).join(' → ')}` };
  });
}
