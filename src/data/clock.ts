import { CLOCK_HOUR_WORDS, clockMinuteWord, voiceId } from './voice-lines';

/**
 * Times on the learning clock are minutes past 12:00 on a 12-hour dial
 * (0–719), so 3:30 is 210. Everything the clock pages show — the two hand
 * angles, "3시 30분", the spoken "세 시 삼십 분" — derives from that one number.
 */
export const CLOCK_DAY = 12 * 60;

export const normalizeTime = (total: number): number => ((Math.round(total) % CLOCK_DAY) + CLOCK_DAY) % CLOCK_DAY;
export const hourOf = (total: number): number => { const hour = Math.floor(normalizeTime(total) / 60); return hour === 0 ? 12 : hour; };
export const minuteOf = (total: number): number => normalizeTime(total) % 60;
export const makeTime = (hour: number, minute: number): number => normalizeTime((hour % 12) * 60 + minute);

/** The hour hand creeps half a degree per minute, so 3:30 points between 3 and 4. */
export const hourHandAngle = (total: number): number => normalizeTime(total) / 2;
export const minuteHandAngle = (total: number): number => minuteOf(total) * 6;

/** "3시 30분" — or just "3시" on the hour, the way children first meet it. */
export function timeLabel(total: number): string {
  const minute = minuteOf(total);
  return minute === 0 ? `${hourOf(total)}시` : `${hourOf(total)}시 ${minute}분`;
}
/** "세 시 삼십 분" / "세 시 정각" — the words the voice clips say. */
export function timeReading(total: number): string {
  const minute = minuteOf(total);
  return `${CLOCK_HOUR_WORDS[hourOf(total)]} 시 ${minute === 0 ? '정각' : `${clockMinuteWord(minute)} 분`}`;
}
/** "3:30" for the little digital display. */
export const digitalLabel = (total: number): string => `${hourOf(total)}:${String(minuteOf(total)).padStart(2, '0')}`;

/** The clips that, played in a row, read a time aloud. Only five-minute times have clips. */
export function timeVoiceIds(total: number): string[] {
  const minute = minuteOf(total);
  return [voiceId.clockHour(hourOf(total)), minute === 0 ? voiceId.phrase('sharp') : voiceId.clockMinute(minute)];
}

/** 을/를 after a dial number read the Sino-Korean way: 일·삼·육·칠·팔·십·십일 end in a consonant. */
export const objectParticle = (number: number): string => ([1, 3, 6, 7, 8, 10, 11].includes(number) ? '을' : '를');
/** 과/와 between two dial numbers: "3과 4 사이", "4와 5 사이". */
export const andParticle = (number: number): string => (objectParticle(number) === '을' ? '과' : '와');
/** 은/는 after a time label: "3시 30분은", "3시는". */
export const topicParticle = (label: string): string => (label.endsWith('분') ? '은' : '는');

/** Which number on the dial the minute hand points at (30분 → 6). */
export const minuteHandNumber = (total: number): number => { const number = minuteOf(total) / 5; return number === 0 ? 12 : Math.round(number); };

/** A random time whose minutes are a multiple of `step`, never equal to `exclude`. */
export function randomTime(step: number, exclude?: number): number {
  const slots = CLOCK_DAY / step;
  let time = normalizeTime(Math.floor(Math.random() * slots) * step);
  while (time === exclude) time = normalizeTime(Math.floor(Math.random() * slots) * step);
  return time;
}
