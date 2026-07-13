import type { LearningCategory } from '@/types/learning';

export interface NumberItem {
  id: string;
  number: number;
  character: string;
  koreanName: string;   // native Korean count word (하나, 열둘, 스물다섯 ...)
  englishName: string;
  object: string;
  objectLabel: string;
  category: LearningCategory;
}

/** Highest number taught in the numbers section. */
export const NUMBERS_MAX = 50;

const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰'];

const ENGLISH_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const ENGLISH_TEENS = [
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
  'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const ENGLISH_TENS = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty'];

/** Objects the child counts. Cycles, so every number gets one to count. */
const COUNTING_OBJECTS = [
  { object: 'apple', objectLabel: '사과' },
  { object: 'cherry', objectLabel: '체리' },
  { object: 'star', objectLabel: '별' },
  { object: 'flower', objectLabel: '꽃' },
  { object: 'butterfly', objectLabel: '나비' },
  { object: 'fish', objectLabel: '물고기' },
  { object: 'balloon', objectLabel: '풍선' },
  { object: 'candy', objectLabel: '사탕' },
  { object: 'cloud', objectLabel: '구름' },
  { object: 'heart', objectLabel: '하트' },
];

/** Native Korean counting word — what a child says when counting objects. */
export function toNativeKoreanName(n: number): string {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${NATIVE_TENS[tens] ?? ''}${NATIVE_ONES[ones]}`;
}

export function toEnglishName(n: number): string {
  if (n < 10) return ENGLISH_ONES[n];
  if (n < 20) return ENGLISH_TEENS[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? ENGLISH_TENS[tens] : `${ENGLISH_TENS[tens]}-${ENGLISH_ONES[ones]}`;
}

export const NUMBERS_DATA: NumberItem[] = Array.from({ length: NUMBERS_MAX }, (_, i) => {
  const number = i + 1;
  const { object, objectLabel } = COUNTING_OBJECTS[i % COUNTING_OBJECTS.length];
  return {
    id: `number-${number}`,
    number,
    character: String(number),
    koreanName: toNativeKoreanName(number),
    englishName: toEnglishName(number),
    object,
    objectLabel,
    category: 'numbers' as const,
  };
});

export function getNumberById(id: string): NumberItem | undefined {
  return NUMBERS_DATA.find((item) => item.id === id);
}

export function getNumberByValue(num: number): NumberItem | undefined {
  return NUMBERS_DATA.find((item) => item.number === num);
}
