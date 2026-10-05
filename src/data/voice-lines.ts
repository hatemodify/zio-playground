import { HANGUL_CONSONANTS, HANGUL_VOWELS, HANGUL_SYLLABLES } from './hangul.ts';
import { ENGLISH_DATA } from './english.ts';
import { NUMBERS_DATA } from './numbers.ts';
import { SHAPES_DATA } from './shapes.ts';
import { PICTURE_WORDS, TWEMOJI_PICTURES } from './picture-content.ts';

/**
 * Every voice clip the app ships, pre-rendered to public/assets/audio/<id>.mp3
 * by scripts/generate-audio.ts. Runtime speech synthesis proved unreliable on
 * tablets, so the lines are fixed here and generated once on a Mac.
 */
export type VoiceLang = 'ko' | 'en';

export interface VoiceLine {
  id: string;
  lang: VoiceLang;
  text: string;
}

const hex = (character: string) => character.codePointAt(0)!.toString(16);

/** Stable clip ids, so the generator and the pages never drift apart. */
export const voiceId = {
  /** A single Hangul jamo or syllable, read aloud (jamo say their name: ㄱ → 기역). */
  hangul: (character: string) => `ko-char-${hex(character)}`,
  /** An uppercase English letter. */
  letter: (letter: string) => `en-letter-${letter.toUpperCase()}`,
  /** A number 1–50, in Korean (native: 하나, 둘…) or English. */
  number: (lang: VoiceLang, value: number) => `${lang}-number-${value}`,
  /** The name of a picture we ship, in either language. */
  word: (lang: VoiceLang, pictureId: string) => `${lang}-word-${pictureId}`,
  /** A basic shape by its slug (circle, triangle…). */
  shape: (lang: VoiceLang, slug: string) => `${lang}-shape-${slug}`,
  /** A fixed phrase such as a position word or a short prompt. */
  phrase: (key: string) => `ko-phrase-${key}`,
};

export const VOICE_PHRASES: Record<string, string> = {
  above: '위', below: '아래', inside: '안', outside: '밖', front: '앞', behind: '뒤', beside: '옆',
  'listen-char': '잘 듣고 글자를 찾아요', 'listen-word': '잘 듣고 그림을 찾아요', 'listen-first': '첫 글자를 찾아요',
  'well-done': '참 잘했어요', 'try-again': '다시 한번 해 볼까요',
};

export function buildVoiceLines(): VoiceLine[] {
  const lines: VoiceLine[] = [];
  for (const item of HANGUL_CONSONANTS) lines.push({ id: voiceId.hangul(item.character), lang: 'ko', text: item.name });
  for (const item of HANGUL_VOWELS) lines.push({ id: voiceId.hangul(item.character), lang: 'ko', text: item.name });
  for (const item of HANGUL_SYLLABLES) lines.push({ id: voiceId.hangul(item.character), lang: 'ko', text: item.character });
  for (const item of ENGLISH_DATA) lines.push({ id: voiceId.letter(item.uppercase), lang: 'en', text: item.uppercase });
  for (const item of NUMBERS_DATA) {
    lines.push({ id: voiceId.number('ko', item.number), lang: 'ko', text: item.koreanName });
    lines.push({ id: voiceId.number('en', item.number), lang: 'en', text: item.englishName });
  }
  for (const item of SHAPES_DATA) {
    lines.push({ id: voiceId.shape('ko', item.slug), lang: 'ko', text: item.name });
    lines.push({ id: voiceId.shape('en', item.slug), lang: 'en', text: item.english });
  }
  for (const item of PICTURE_WORDS) {
    lines.push({ id: voiceId.word('ko', item.id), lang: 'ko', text: item.name });
    lines.push({ id: voiceId.word('en', item.id), lang: 'en', text: item.english });
  }
  for (const [id, item] of Object.entries(TWEMOJI_PICTURES)) {
    lines.push({ id: voiceId.word('ko', id), lang: 'ko', text: item.name });
    lines.push({ id: voiceId.word('en', id), lang: 'en', text: item.english });
  }
  for (const [key, text] of Object.entries(VOICE_PHRASES)) lines.push({ id: voiceId.phrase(key), lang: 'ko', text });
  return lines;
}

export const voiceClipUrl = (id: string): string => `/assets/audio/${id}.mp3`;
