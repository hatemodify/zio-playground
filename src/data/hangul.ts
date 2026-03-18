import type { LearningCategory } from '@/types/learning';

export type HangulType = 'consonant' | 'vowel';

export interface HangulItem {
  id: string;
  character: string;
  name: string;
  type: HangulType;
  representativeWord: string;
  wordImage: string;
  category: LearningCategory;
}

export const HANGUL_CONSONANTS: HangulItem[] = [
  { id: 'hangul-ㄱ', character: 'ㄱ', name: '기역', type: 'consonant', representativeWord: '기린', wordImage: 'giraffe', category: 'hangul' },
  { id: 'hangul-ㄴ', character: 'ㄴ', name: '니은', type: 'consonant', representativeWord: '나비', wordImage: 'butterfly', category: 'hangul' },
  { id: 'hangul-ㄷ', character: 'ㄷ', name: '디귿', type: 'consonant', representativeWord: '다람쥐', wordImage: 'squirrel', category: 'hangul' },
  { id: 'hangul-ㄹ', character: 'ㄹ', name: '리을', type: 'consonant', representativeWord: '로봇', wordImage: 'robot', category: 'hangul' },
  { id: 'hangul-ㅁ', character: 'ㅁ', name: '미음', type: 'consonant', representativeWord: '무지개', wordImage: 'rainbow', category: 'hangul' },
  { id: 'hangul-ㅂ', character: 'ㅂ', name: '비읍', type: 'consonant', representativeWord: '바나나', wordImage: 'banana', category: 'hangul' },
  { id: 'hangul-ㅅ', character: 'ㅅ', name: '시옷', type: 'consonant', representativeWord: '사과', wordImage: 'apple', category: 'hangul' },
  { id: 'hangul-ㅇ', character: 'ㅇ', name: '이응', type: 'consonant', representativeWord: '오리', wordImage: 'duck', category: 'hangul' },
  { id: 'hangul-ㅈ', character: 'ㅈ', name: '지읒', type: 'consonant', representativeWord: '자동차', wordImage: 'car', category: 'hangul' },
  { id: 'hangul-ㅊ', character: 'ㅊ', name: '치읓', type: 'consonant', representativeWord: '치즈', wordImage: 'cheese', category: 'hangul' },
  { id: 'hangul-ㅋ', character: 'ㅋ', name: '키읔', type: 'consonant', representativeWord: '코끼리', wordImage: 'elephant', category: 'hangul' },
  { id: 'hangul-ㅌ', character: 'ㅌ', name: '티읕', type: 'consonant', representativeWord: '토끼', wordImage: 'rabbit', category: 'hangul' },
  { id: 'hangul-ㅍ', character: 'ㅍ', name: '피읖', type: 'consonant', representativeWord: '포도', wordImage: 'grape', category: 'hangul' },
  { id: 'hangul-ㅎ', character: 'ㅎ', name: '히읗', type: 'consonant', representativeWord: '하마', wordImage: 'hippo', category: 'hangul' },
];

export const HANGUL_VOWELS: HangulItem[] = [
  { id: 'hangul-ㅏ', character: 'ㅏ', name: '아', type: 'vowel', representativeWord: '아이스크림', wordImage: 'icecream', category: 'hangul' },
  { id: 'hangul-ㅑ', character: 'ㅑ', name: '야', type: 'vowel', representativeWord: '야구공', wordImage: 'baseball', category: 'hangul' },
  { id: 'hangul-ㅓ', character: 'ㅓ', name: '어', type: 'vowel', representativeWord: '어린이', wordImage: 'children', category: 'hangul' },
  { id: 'hangul-ㅕ', character: 'ㅕ', name: '여', type: 'vowel', representativeWord: '여우', wordImage: 'fox', category: 'hangul' },
  { id: 'hangul-ㅗ', character: 'ㅗ', name: '오', type: 'vowel', representativeWord: '오렌지', wordImage: 'orange', category: 'hangul' },
  { id: 'hangul-ㅛ', character: 'ㅛ', name: '요', type: 'vowel', representativeWord: '요리사', wordImage: 'chef', category: 'hangul' },
  { id: 'hangul-ㅜ', character: 'ㅜ', name: '우', type: 'vowel', representativeWord: '우산', wordImage: 'umbrella', category: 'hangul' },
  { id: 'hangul-ㅠ', character: 'ㅠ', name: '유', type: 'vowel', representativeWord: '유니콘', wordImage: 'unicorn', category: 'hangul' },
  { id: 'hangul-ㅡ', character: 'ㅡ', name: '으', type: 'vowel', representativeWord: '으뜸', wordImage: 'trophy', category: 'hangul' },
  { id: 'hangul-ㅣ', character: 'ㅣ', name: '이', type: 'vowel', representativeWord: '이빨', wordImage: 'tooth', category: 'hangul' },
];

export const HANGUL_DATA: HangulItem[] = [...HANGUL_CONSONANTS, ...HANGUL_VOWELS];

export function getHangulById(id: string): HangulItem | undefined {
  return HANGUL_DATA.find((item) => item.id === id);
}

export function getHangulByCharacter(char: string): HangulItem | undefined {
  return HANGUL_DATA.find((item) => item.character === char);
}
