import Picture from './Picture';
import type { PictureId } from '@/data/picture-content';

const ART: Record<string, { picture: PictureId; friend?: PictureId; text?: string; background: string }> = {
  'vehicle-missions': { picture: 'excavator', friend: 'police-car', background: '#f7e8c8' },
  'little-market': { picture: 'apple', friend: 'carrot', text: '2 + 1', background: '#fff0ce' },
  'animal-families': { picture: 'penguin', friend: 'rabbit', background: '#dff0ee' },
  'picture-words': { picture: 'police-car', text: '경 찰 차', background: '#f1e6f4' },
  'pattern-garden': { picture: 'dump-truck', friend: 'crane', text: '?', background: '#e7efd6' },
  'mini-festival': { picture: 'star', friend: 'rocket', text: '● ▲ ■', background: '#dedcf6' },
  'rocket-ride': { picture: 'rocket', friend: 'star', background: '#233654' },
  'animal-playground': { picture: 'excavator', friend: 'bus', background: '#e3f1d6' },
  matching: { picture: 'rabbit', text: '토끼', background: '#e3edf6' },
  sorting: { picture: 'car', text: '1 2 3', background: '#fae8d8' },
  coloring: { picture: 'parrot', text: '● ● ●', background: '#f5e4e8' },
  shadow: { picture: 'elephant', text: '?', background: '#dfe3ef' },
  'word-builder': { picture: 'banana', text: '바 나 나', background: '#f9f0cf' },
  'missing-char': { picture: 'police-car', text: '1 ? 3', background: '#e3edf6' },
  'size-compare': { picture: 'elephant', friend: 'rabbit', background: '#e3efd9' },
  'odd-one-out': { picture: 'rabbit', friend: 'penguin', text: '?', background: '#f5e5d9' },
  'memory-sequence': { picture: 'monkey', text: '1 2 3', background: '#e9e5f6' },
  'free-draw': { picture: 'parrot', text: '○ △ □', background: '#f9efd6' },
  puzzle: { picture: 'panda', text: '□', background: '#e6e8f5' },
  'connect-dots': { picture: 'giraffe', text: '1 · 2', background: '#f5eedc' },
  'whack-a-mole': { picture: 'car', friend: 'police-car', background: '#e1eacb' },
  'juice-math': { picture: 'strawberry', friend: 'orange', text: '3 + 4', background: '#ffe4e6' },
  'number-compare': { picture: 'elephant', friend: 'pig', text: '>', background: '#e4eff4' },
  'food-stack': { picture: 'burger', friend: 'cheese', background: '#fff0ce' },
};
export default function GameArtwork({ gameId }: { gameId: string }) {
  if (gameId === 'daruma') return <div aria-hidden="true" className="relative flex h-36 flex-col items-center justify-center bg-[#f4e5cc] sm:h-40"><img src="/assets/illustrations/daruma.svg" alt="" className="h-24 w-24" /><div className="h-3 w-20 rounded-full bg-[#71b6db]" /><div className="h-3 w-20 rounded-full bg-[#ef9d54]" /><img src="/assets/illustrations/daruma-mallet.svg" alt="" className="absolute bottom-4 right-[12%] h-16 w-16 -rotate-45" /></div>;
  if (gameId === 'food-stack') return <div aria-hidden="true" className="relative flex h-36 w-full items-center justify-center gap-1 overflow-hidden bg-[#fff0ce] sm:h-40"><img src="/assets/twemoji/pizza.svg" alt="" className="h-20 w-20 -rotate-12" /><img src="/assets/twemoji/pancakes.svg" alt="" className="h-24 w-24 rotate-6" /><img src="/assets/twemoji/sandwich.svg" alt="" className="absolute bottom-3 right-4 h-14 w-14" /></div>;
  const art = ART[gameId] ?? ART.matching;
  return <div aria-hidden="true" className="relative flex h-36 w-full items-center justify-center overflow-hidden sm:h-40" style={{ background: art.background }}>
    <div className="absolute -bottom-14 -left-8 h-28 w-52 rotate-12 rounded-[50%] bg-white/25" />
    <div className="absolute -right-3 -top-6 h-24 w-24 rounded-full bg-white/25" />
    {art.friend && <Picture id={art.friend} className="absolute bottom-4 right-[12%] h-16 w-16 rotate-12 sm:h-20 sm:w-20" />}
    <Picture id={art.picture} className={`relative z-10 h-24 w-24 ${art.friend ? '-translate-x-5 -rotate-6' : art.text ? '-translate-x-5' : ''}`} />
    {art.text && <span className="absolute right-3 top-4 z-20 rounded-xl border-2 border-white bg-white/90 px-2 py-1 font-display text-lg font-extrabold text-slate-700 shadow-sm">{art.text}</span>}
  </div>;
}
