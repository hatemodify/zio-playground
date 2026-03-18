import type { LearningCategory } from '@/types/learning';

export interface EnglishItem {
  id: string;
  uppercase: string;
  lowercase: string;
  character: string;
  word: string;
  wordKorean: string;
  wordImage: string;
  category: LearningCategory;
}

export const ENGLISH_DATA: EnglishItem[] = [
  { id: 'english-A', uppercase: 'A', lowercase: 'a', character: 'A', word: 'Apple', wordKorean: '사과', wordImage: 'apple', category: 'english' },
  { id: 'english-B', uppercase: 'B', lowercase: 'b', character: 'B', word: 'Bear', wordKorean: '곰', wordImage: 'bear', category: 'english' },
  { id: 'english-C', uppercase: 'C', lowercase: 'c', character: 'C', word: 'Cat', wordKorean: '고양이', wordImage: 'cat', category: 'english' },
  { id: 'english-D', uppercase: 'D', lowercase: 'd', character: 'D', word: 'Dog', wordKorean: '강아지', wordImage: 'dog', category: 'english' },
  { id: 'english-E', uppercase: 'E', lowercase: 'e', character: 'E', word: 'Elephant', wordKorean: '코끼리', wordImage: 'elephant', category: 'english' },
  { id: 'english-F', uppercase: 'F', lowercase: 'f', character: 'F', word: 'Fish', wordKorean: '물고기', wordImage: 'fish', category: 'english' },
  { id: 'english-G', uppercase: 'G', lowercase: 'g', character: 'G', word: 'Giraffe', wordKorean: '기린', wordImage: 'giraffe', category: 'english' },
  { id: 'english-H', uppercase: 'H', lowercase: 'h', character: 'H', word: 'Hat', wordKorean: '모자', wordImage: 'hat', category: 'english' },
  { id: 'english-I', uppercase: 'I', lowercase: 'i', character: 'I', word: 'Ice cream', wordKorean: '아이스크림', wordImage: 'icecream', category: 'english' },
  { id: 'english-J', uppercase: 'J', lowercase: 'j', character: 'J', word: 'Jellyfish', wordKorean: '해파리', wordImage: 'jellyfish', category: 'english' },
  { id: 'english-K', uppercase: 'K', lowercase: 'k', character: 'K', word: 'Koala', wordKorean: '코알라', wordImage: 'koala', category: 'english' },
  { id: 'english-L', uppercase: 'L', lowercase: 'l', character: 'L', word: 'Lion', wordKorean: '사자', wordImage: 'lion', category: 'english' },
  { id: 'english-M', uppercase: 'M', lowercase: 'm', character: 'M', word: 'Moon', wordKorean: '달', wordImage: 'moon', category: 'english' },
  { id: 'english-N', uppercase: 'N', lowercase: 'n', character: 'N', word: 'Nest', wordKorean: '둥지', wordImage: 'nest', category: 'english' },
  { id: 'english-O', uppercase: 'O', lowercase: 'o', character: 'O', word: 'Octopus', wordKorean: '문어', wordImage: 'octopus', category: 'english' },
  { id: 'english-P', uppercase: 'P', lowercase: 'p', character: 'P', word: 'Penguin', wordKorean: '펭귄', wordImage: 'penguin', category: 'english' },
  { id: 'english-Q', uppercase: 'Q', lowercase: 'q', character: 'Q', word: 'Queen', wordKorean: '여왕', wordImage: 'queen', category: 'english' },
  { id: 'english-R', uppercase: 'R', lowercase: 'r', character: 'R', word: 'Rabbit', wordKorean: '토끼', wordImage: 'rabbit', category: 'english' },
  { id: 'english-S', uppercase: 'S', lowercase: 's', character: 'S', word: 'Sun', wordKorean: '태양', wordImage: 'sun', category: 'english' },
  { id: 'english-T', uppercase: 'T', lowercase: 't', character: 'T', word: 'Tiger', wordKorean: '호랑이', wordImage: 'tiger', category: 'english' },
  { id: 'english-U', uppercase: 'U', lowercase: 'u', character: 'U', word: 'Umbrella', wordKorean: '우산', wordImage: 'umbrella', category: 'english' },
  { id: 'english-V', uppercase: 'V', lowercase: 'v', character: 'V', word: 'Violin', wordKorean: '바이올린', wordImage: 'violin', category: 'english' },
  { id: 'english-W', uppercase: 'W', lowercase: 'w', character: 'W', word: 'Whale', wordKorean: '고래', wordImage: 'whale', category: 'english' },
  { id: 'english-X', uppercase: 'X', lowercase: 'x', character: 'X', word: 'Xylophone', wordKorean: '실로폰', wordImage: 'xylophone', category: 'english' },
  { id: 'english-Y', uppercase: 'Y', lowercase: 'y', character: 'Y', word: 'Yacht', wordKorean: '요트', wordImage: 'yacht', category: 'english' },
  { id: 'english-Z', uppercase: 'Z', lowercase: 'z', character: 'Z', word: 'Zebra', wordKorean: '얼룩말', wordImage: 'zebra', category: 'english' },
];

export function getEnglishById(id: string): EnglishItem | undefined {
  return ENGLISH_DATA.find((item) => item.id === id);
}

export function getEnglishByCharacter(char: string): EnglishItem | undefined {
  return ENGLISH_DATA.find(
    (item) => item.uppercase === char.toUpperCase(),
  );
}
