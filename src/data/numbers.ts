import type { LearningCategory } from '@/types/learning';

export interface NumberItem {
  id: string;
  number: number;
  character: string;
  koreanName: string;
  englishName: string;
  object: string;
  objectLabel: string;
  category: LearningCategory;
}

export const NUMBERS_DATA: NumberItem[] = [
  { id: 'number-1', number: 1, character: '1', koreanName: '하나', englishName: 'One', object: 'apple', objectLabel: '사과', category: 'numbers' },
  { id: 'number-2', number: 2, character: '2', koreanName: '둘', englishName: 'Two', object: 'cherry', objectLabel: '체리', category: 'numbers' },
  { id: 'number-3', number: 3, character: '3', koreanName: '셋', englishName: 'Three', object: 'star', objectLabel: '별', category: 'numbers' },
  { id: 'number-4', number: 4, character: '4', koreanName: '넷', englishName: 'Four', object: 'flower', objectLabel: '꽃', category: 'numbers' },
  { id: 'number-5', number: 5, character: '5', koreanName: '다섯', englishName: 'Five', object: 'butterfly', objectLabel: '나비', category: 'numbers' },
  { id: 'number-6', number: 6, character: '6', koreanName: '여섯', englishName: 'Six', object: 'fish', objectLabel: '물고기', category: 'numbers' },
  { id: 'number-7', number: 7, character: '7', koreanName: '일곱', englishName: 'Seven', object: 'balloon', objectLabel: '풍선', category: 'numbers' },
  { id: 'number-8', number: 8, character: '8', koreanName: '여덟', englishName: 'Eight', object: 'candy', objectLabel: '사탕', category: 'numbers' },
  { id: 'number-9', number: 9, character: '9', koreanName: '아홉', englishName: 'Nine', object: 'cloud', objectLabel: '구름', category: 'numbers' },
  { id: 'number-10', number: 10, character: '10', koreanName: '열', englishName: 'Ten', object: 'heart', objectLabel: '하트', category: 'numbers' },
];

export function getNumberById(id: string): NumberItem | undefined {
  return NUMBERS_DATA.find((item) => item.id === id);
}

export function getNumberByValue(num: number): NumberItem | undefined {
  return NUMBERS_DATA.find((item) => item.number === num);
}
