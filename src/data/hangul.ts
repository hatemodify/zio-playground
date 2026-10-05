import type { LearningCategory } from '@/types/learning';

export type HangulType = 'consonant' | 'vowel' | 'syllable';

export interface HangulItem {
  id: string;
  character: string;
  name: string;
  type: HangulType;
  representativeWord: string;
  wordImage: string;
  category: LearningCategory;
  consonant?: string;
  vowel?: string;
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
  { id: 'hangul-ㅍ', character: 'ㅍ', name: '피읖', type: 'consonant', representativeWord: '포도', wordImage: 'grapes', category: 'hangul' },
  { id: 'hangul-ㅎ', character: 'ㅎ', name: '히읗', type: 'consonant', representativeWord: '하마', wordImage: 'hippo', category: 'hangul' },
];

export const HANGUL_VOWELS: HangulItem[] = [
  { id: 'hangul-ㅏ', character: 'ㅏ', name: '아', type: 'vowel', representativeWord: '아이스크림', wordImage: 'ice-cream', category: 'hangul' },
  { id: 'hangul-ㅑ', character: 'ㅑ', name: '야', type: 'vowel', representativeWord: '야구공', wordImage: 'baseball', category: 'hangul' },
  { id: 'hangul-ㅓ', character: 'ㅓ', name: '어', type: 'vowel', representativeWord: '어린이', wordImage: 'child', category: 'hangul' },
  { id: 'hangul-ㅕ', character: 'ㅕ', name: '여', type: 'vowel', representativeWord: '여우', wordImage: 'fox', category: 'hangul' },
  { id: 'hangul-ㅗ', character: 'ㅗ', name: '오', type: 'vowel', representativeWord: '오렌지', wordImage: 'orange', category: 'hangul' },
  { id: 'hangul-ㅛ', character: 'ㅛ', name: '요', type: 'vowel', representativeWord: '요리사', wordImage: 'chef', category: 'hangul' },
  { id: 'hangul-ㅜ', character: 'ㅜ', name: '우', type: 'vowel', representativeWord: '우산', wordImage: 'umbrella', category: 'hangul' },
  { id: 'hangul-ㅠ', character: 'ㅠ', name: '유', type: 'vowel', representativeWord: '유니콘', wordImage: 'unicorn', category: 'hangul' },
  { id: 'hangul-ㅡ', character: 'ㅡ', name: '으', type: 'vowel', representativeWord: '으뜸', wordImage: 'trophy', category: 'hangul' },
  { id: 'hangul-ㅣ', character: 'ㅣ', name: '이', type: 'vowel', representativeWord: '이빨', wordImage: 'tooth', category: 'hangul' },
];

// Unicode uses 19 initial consonants and 21 vowels, including doubled/compound forms.
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
/**
 * A real word (with a picture we ship) that starts with the syllable, so the
 * composed glyph connects to something a child can name. Syllables without an
 * everyday word keep the bare "consonant + vowel" label.
 */
export const SYLLABLE_WORDS: Record<string, { word: string; image: string }> = {
  가: { word: '가방', image: 'backpack' }, 나: { word: '나비', image: 'butterfly' }, 다: { word: '다람쥐', image: 'squirrel' },
  라: { word: '라디오', image: 'radio' }, 마: { word: '마이크', image: 'microphone' }, 바: { word: '바나나', image: 'banana' },
  사: { word: '사과', image: 'apple' }, 아: { word: '아이스크림', image: 'ice-cream' }, 자: { word: '자동차', image: 'car' },
  차: { word: '차', image: 'coffee' }, 카: { word: '카메라', image: 'camera' },
  파: { word: '파인애플', image: 'pineapple' }, 하: { word: '하마', image: 'hippo' },
  거: { word: '거북이', image: 'turtle' }, 너: { word: '너구리', image: 'raccoon' }, 머: { word: '머핀', image: 'cupcake' },
  버: { word: '버스', image: 'bus' }, 서: { word: '서커스', image: 'circus' }, 어: { word: '어린이', image: 'child' },
  커: { word: '커피', image: 'coffee' },
  고: { word: '고양이', image: 'cat' }, 노: { word: '노래', image: 'music-note' }, 도: { word: '도넛', image: 'doughnut' },
  로: { word: '로봇', image: 'robot' }, 모: { word: '모자', image: 'hat' }, 보: { word: '보트', image: 'boat' },
  소: { word: '소', image: 'cow' }, 오: { word: '오리', image: 'duck' }, 조: { word: '조개', image: 'shell' },
  초: { word: '초콜릿', image: 'chocolate' }, 코: { word: '코끼리', image: 'elephant' }, 토: { word: '토끼', image: 'rabbit' },
  포: { word: '포도', image: 'grapes' }, 호: { word: '호박', image: 'pumpkin' },
  구: { word: '구름', image: 'cloud' }, 무: { word: '무지개', image: 'rainbow' }, 부: { word: '부엉이', image: 'owl' },
  수: { word: '수박', image: 'watermelon' }, 우: { word: '우산', image: 'umbrella' }, 주: { word: '주스', image: 'juice' },
  쿠: { word: '쿠키', image: 'cookie' },
  기: { word: '기린', image: 'giraffe' }, 리: { word: '리본', image: 'ribbon' }, 비: { word: '비행기', image: 'airplane' },
  시: { word: '시계', image: 'alarm-clock' }, 이: { word: '이빨', image: 'tooth' }, 지: { word: '지구', image: 'earth' },
  치: { word: '치즈', image: 'cheese' }, 키: { word: '키위', image: 'kiwi' }, 티: { word: '티셔츠', image: 't-shirt' },
  피: { word: '피자', image: 'pizza' },
  브: { word: '브로콜리', image: 'broccoli' }, 스: { word: '스키', image: 'ski' }, 크: { word: '크레파스', image: 'crayon' },
  트: { word: '트럭', image: 'truck' },
  야: { word: '야구공', image: 'baseball' }, 여: { word: '여우', image: 'fox' }, 요: { word: '요리사', image: 'chef' },
  유: { word: '유니콘', image: 'unicorn' }, 겨: { word: '겨울', image: 'snowman' }, 혀: { word: '혀', image: 'tongue' },
  휴: { word: '휴지', image: 'toilet-paper' },
};

export const HANGUL_SYLLABLES: HangulItem[] = HANGUL_VOWELS.flatMap((vowel) =>
  HANGUL_CONSONANTS.map((consonant) => {
    const character = String.fromCharCode(0xAC00 + (INITIALS.indexOf(consonant.character) * 21 + MEDIALS.indexOf(vowel.character)) * 28);
    const word = SYLLABLE_WORDS[character];
    return {
      id: `hangul-${character}`, character, name: character, type: 'syllable',
      consonant: consonant.character, vowel: vowel.character,
      representativeWord: word?.word ?? `${consonant.character} + ${vowel.character}`, wordImage: word?.image ?? '', category: 'hangul',
    };
  }),
);

/** Initial consonant (one of the 14 basic ones) of a complete syllable, or the character itself for jamo. */
export function initialConsonantOf(syllable: string): string {
  const code = syllable.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return syllable;
  return INITIALS[Math.floor(code / 588)];
}

export const HANGUL_DATA: HangulItem[] = [...HANGUL_CONSONANTS, ...HANGUL_VOWELS, ...HANGUL_SYLLABLES];

export function getHangulById(id: string): HangulItem | undefined {
  return HANGUL_DATA.find((item) => item.id === id);
}

export function getHangulByCharacter(char: string): HangulItem | undefined {
  return HANGUL_DATA.find((item) => item.character === char);
}
