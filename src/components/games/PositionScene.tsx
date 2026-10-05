import { picturePath, pictureName, type PictureId } from '@/data/picture-content';
import type { Position } from '@/data/discovery-games';
import { cn } from '@/lib/cn';

/** Where the animal is drawn (viewBox 0 0 240 200) for each position word. */
const SPOTS: Record<Position, { x: number; y: number; size: number }> = {
  위: { x: 90, y: 30, size: 48 },
  아래: { x: 86, y: 144, size: 48 },
  안: { x: 84, y: 40, size: 52 },
  앞: { x: 86, y: 88, size: 52 },
  뒤: { x: 126, y: 28, size: 56 },
  옆: { x: 166, y: 84, size: 44 },
};

/**
 * A box on a table with an animal friend placed 위/아래/안/앞/뒤/옆 of the box.
 * Drawing order does the teaching: 뒤 and 안 are painted before the box so the
 * box hides part of the friend, 앞 is painted after it and overlaps the front.
 */
export default function PositionScene({ animal, place, className, label }: { animal: PictureId; place: Position; className?: string; label?: string }) {
  const spot = SPOTS[place];
  const friend = <image href={picturePath(animal)} x={spot.x} y={spot.y} width={spot.size} height={spot.size} preserveAspectRatio="xMidYMid meet" />;
  const behind = place === '뒤' || place === '안';
  return <svg viewBox="0 0 240 200" className={cn('position-scene', className)} role="img" data-place={place}
    aria-label={label ?? `${pictureName(animal)}가 상자 ${place}에 있는 그림`}>
    <rect width="240" height="200" rx="20" fill="#eef6ff" />
    <rect y="124" width="240" height="76" fill="#f6e7cf" />
    <rect x="36" y="140" width="12" height="54" rx="3" fill="#b8865a" />
    <rect x="192" y="140" width="12" height="54" rx="3" fill="#b8865a" />
    <rect x="24" y="128" width="192" height="12" rx="4" fill="#d9a56f" />
    {place === '안' && <>
      <path d="M82 72h80l4-34H86z" fill="#f0c58a" stroke="#b07a3a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M70 84 82 72h80l-12 12z" fill="#8d5a2b" />
    </>}
    {behind && friend}
    {place !== '안' && <path d="M70 84 82 72h80l-12 12z" fill="#f0c58a" stroke="#b07a3a" strokeWidth="2" strokeLinejoin="round" />}
    <path d="M150 84 162 72v44l-12 12z" fill="#c98f4f" stroke="#b07a3a" strokeWidth="2" strokeLinejoin="round" />
    <rect x="70" y="84" width="80" height="44" fill="#e8b06a" stroke="#b07a3a" strokeWidth="2" strokeLinejoin="round" />
    <path d="M70 100h80" stroke="#b07a3a" strokeWidth="2" strokeDasharray="6 5" />
    {!behind && friend}
  </svg>;
}
