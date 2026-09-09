import Picture from './Picture';
import type { PictureId } from '@/data/picture-content';

const ART: Record<string, { picture: PictureId; friend?: PictureId; text?: string; background: string }> = {
  'vehicle-missions': { picture: 'excavator', friend: 'police-car', background: '#f7e8c8' },
  'little-market': { picture: 'apple', friend: 'carrot', text: '2 + 1', background: '#fff0ce' },
  'animal-families': { picture: 'penguin', friend: 'rabbit', background: '#dff0ee' },
  'picture-words': { picture: 'police-car', text: '경 찰 차', background: '#f1e6f4' },
  'pattern-garden': { picture: 'dump-truck', friend: 'crane', text: '?', background: '#e7efd6' },
  'rocket-ride': { picture: 'rocket', friend: 'star', background: '#233654' },
  'animal-playground': { picture: 'excavator', friend: 'bus', background: '#e3f1d6' },
  matching: { picture: 'rabbit', text: '토끼', background: '#e3edf6' },
  sorting: { picture: 'car', text: '1 2 3', background: '#fae8d8' },
  coloring: { picture: 'parrot', text: '● ● ●', background: '#f5e4e8' },
  bubble: { picture: 'apple', friend: 'apple', background: '#dcedf6' },
  shadow: { picture: 'elephant', text: '?', background: '#dfe3ef' },
  'word-builder': { picture: 'banana', text: '바 나 나', background: '#f9f0cf' },
  'missing-char': { picture: 'police-car', text: '1 ? 3', background: '#e3edf6' },
  'size-compare': { picture: 'elephant', friend: 'rabbit', background: '#e3efd9' },
  'odd-one-out': { picture: 'rabbit', friend: 'penguin', text: '?', background: '#f5e5d9' },
  pattern: { picture: 'pig', friend: 'panda', text: '?', background: '#f4e4ef' },
  'memory-sequence': { picture: 'monkey', text: '1 2 3', background: '#e9e5f6' },
  'free-draw': { picture: 'parrot', text: '○ △ □', background: '#f9efd6' },
  counting: { picture: 'strawberry', friend: 'strawberry', text: '3', background: '#f5e4df' },
  'tracing-race': { picture: 'race-car', text: 'A B', background: '#e1f0ed' },
  puzzle: { picture: 'panda', text: '□', background: '#e6e8f5' },
  'connect-dots': { picture: 'giraffe', text: '1 · 2', background: '#f5eedc' },
  'whack-a-mole': { picture: 'car', friend: 'police-car', background: '#e1eacb' },
  'catch-falling': { picture: 'star', friend: 'rocket-blue', background: '#e5e2f5' },
  'tap-speed': { picture: 'race-car', text: 'GO!', background: '#f4e7d6' },
  addition: { picture: 'apple', friend: 'apple', text: '+', background: '#e7efd9' },
  'number-compare': { picture: 'elephant', friend: 'pig', text: '>', background: '#e4eff4' },
  'number-order': { picture: 'police-car', text: '3 4 5', background: '#ece6f3' },
  'food-stack': { picture: 'burger', friend: 'cheese', background: '#fff0ce' },
};
export default function GameArtwork({ gameId }: { gameId: string }) {
  const art = ART[gameId] ?? ART.matching;
  return <div aria-hidden="true" className="relative flex h-36 w-full items-center justify-center overflow-hidden sm:h-40" style={{ background: art.background }}>
    <div className="absolute -bottom-14 -left-8 h-28 w-52 rotate-12 rounded-[50%] bg-white/25" />
    <div className="absolute -right-3 -top-6 h-24 w-24 rounded-full bg-white/25" />
    {art.friend && <Picture id={art.friend} className="absolute bottom-4 right-[12%] h-16 w-16 rotate-12 sm:h-20 sm:w-20" />}
    <Picture id={art.picture} className={`relative z-10 h-24 w-24 ${art.friend ? '-translate-x-5 -rotate-6' : art.text ? '-translate-x-5' : ''}`} />
    {art.text && <span className="absolute right-3 top-4 z-20 rounded-xl border-2 border-white bg-white/90 px-2 py-1 font-display text-lg font-extrabold text-slate-700 shadow-sm">{art.text}</span>}
  </div>;
}
