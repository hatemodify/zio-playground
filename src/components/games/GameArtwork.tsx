import type { CSSProperties } from 'react';
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
  'tilt-race': { picture: 'race-car', friend: 'trophy', background: '#d5eaf1' },
  'cookie-runner': { picture: 'cookie', friend: 'star', background: '#e4d1ec' },
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
  'word-pictures': { picture: 'rabbit', friend: 'apple', text: '토끼', background: '#fdf0d5' },
  'first-sound': { picture: 'giraffe', text: 'ㄱ', background: '#e2f4ea' },
  'position-words': { picture: 'bear', friend: 'gift', text: '위 · 아래', background: '#e7eef9' },
  'daily-routine': { picture: 'toothbrush', friend: 'soap', text: '1 → 2 → 3', background: '#e3f6f5' },
  'listen-find': { picture: 'parrot', text: '🔊', background: '#f4e6f8' },
  'tens-ones': { picture: 'egg', friend: 'egg', text: '10 + 3', background: '#fff3d6' },
  'number-bonds': { picture: 'rabbit', friend: 'rabbit', text: '3 + ?', background: '#e7f3e1' },
  'shape-explorer': { picture: 'kite', friend: 'soccer-ball', text: '○ △ □', background: '#fde8e6' },
  maze: { picture: 'rabbit', friend: 'carrot', text: '⌐ ¬', background: '#e9f0d8' },
  'number-rain': { picture: 'umbrella', text: '3 7 1', background: '#dcebf7' },
  clock: { picture: 'alarm-clock', text: '3:30', background: '#e3eefb' },
};
const PALETTES = [
  { sky: '#79D8F4', hill: '#57C99B', glow: '#FFF1A6' },
  { sky: '#FFC3D0', hill: '#F69F83', glow: '#FFF4B4' },
  { sky: '#CBB8FF', hill: '#8A9FE8', glow: '#FFF2B1' },
  { sky: '#FFE39D', hill: '#EFAD76', glow: '#FFF9CC' },
  { sky: '#A5EBD9', hill: '#64C9C1', glow: '#FFF0A6' },
  { sky: '#FFCCA9', hill: '#F39DBA', glow: '#FFF5BF' },
] as const;

export default function GameArtwork({ gameId }: { gameId: string }) {
  const art = ART[gameId] ?? ART.matching;
  const palette = PALETTES[[...gameId].reduce((value, letter) => value + letter.charCodeAt(0), 0) % PALETTES.length];
  const style = { '--art-sky': palette.sky, '--art-hill': palette.hill, '--art-glow': palette.glow, '--art-detail': art.background } as CSSProperties;
  return <div aria-hidden="true" className="game-artwork" style={style}>
    <span className="game-artwork-sun" />
    <span className="game-artwork-cloud game-artwork-cloud-left" />
    <span className="game-artwork-cloud game-artwork-cloud-right" />
    <span className="game-artwork-hill game-artwork-hill-back" />
    <span className="game-artwork-hill game-artwork-hill-front" />
    <span className="game-artwork-spark game-artwork-spark-one">✦</span>
    <span className="game-artwork-spark game-artwork-spark-two">✦</span>
    <span className="game-artwork-stage">
      {gameId === 'daruma' ? <><img src="/assets/illustrations/daruma.svg" alt="" className="game-artwork-main" /><img src="/assets/illustrations/daruma-mallet.svg" alt="" className="game-artwork-friend" /></>
        : gameId === 'food-stack' ? <><img src="/assets/twemoji/pancakes.svg" alt="" className="game-artwork-main" /><img src="/assets/twemoji/pizza.svg" alt="" className="game-artwork-friend" /></>
          : <><Picture id={art.picture} className="game-artwork-main" />{art.friend && <Picture id={art.friend} className="game-artwork-friend" />}</>}
    </span>
    {art.text && <span data-i18n-ignore className="game-artwork-note">{art.text}</span>}
  </div>;
}
