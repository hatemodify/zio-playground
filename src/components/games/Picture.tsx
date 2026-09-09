import { picturePath, type PictureId } from '@/data/picture-content';
import { cn } from '@/lib/cn';

export default function Picture({ id, label = '', className }: { id: PictureId; label?: string; className?: string }) {
  return <img src={picturePath(id)} alt={label} draggable={false}
    className={cn('inline-block h-20 w-20 select-none object-contain drop-shadow-sm', className)} />;
}

const TOKENS: Record<string, PictureId> = {
  '🐻': 'bear', '🐶': 'dog', '🦆': 'duck', '🐮': 'cow', '🐴': 'horse', '🦓': 'zebra', '🦉': 'owl', '🐊': 'crocodile', '🐐': 'goat', '🐳': 'whale',
  '🐰': 'rabbit', '🐘': 'elephant', '🦒': 'giraffe', '🐒': 'monkey', '🐼': 'panda', '🦛': 'hippo', '🐷': 'pig',
  '🦜': 'parrot', '🐧': 'penguin', '🐍': 'snake', '🍎': 'apple', '🍌': 'banana', '🥕': 'carrot', '🥦': 'broccoli',
  '🌽': 'corn', '🍅': 'tomato', '🎃': 'pumpkin', '🍇': 'grapes', '🍓': 'strawberry', '🍊': 'orange', '🧀': 'cheese',
  '🍞': 'bread', '🍄': 'mushroom', '🥚': 'egg', '🍔': 'burger', '🍩': 'donut', '🐟': 'fish',
  '🚀': 'rocket', '⭐': 'star', '🌟': 'star', '🚗': 'car', '🚙': 'suv', '🏎️': 'race-car',
  '🚓': 'police-car', '🚒': 'fire-truck', '🚑': 'ambulance', '🚕': 'taxi', '🛻': 'pickup', '🚐': 'bus', '🚎': 'bus', '🚌': 'bus', '🚚': 'truck', '🚛': 'dump-truck', '🚜': 'tractor', '🏗️': 'crane', '✈️': 'airplane', '🚁': 'helicopter', '🚂': 'train', '🚃': 'high-speed-train', '⛵': 'boat', '🛩️': 'light-plane', '🛸': 'ufo', '🏆': 'trophy',
};
export function PictureToken({ value, className }: { value: string; className?: string }) {
  const id = TOKENS[value];
  return id ? <Picture id={id} className={cn('h-[1.5em] w-[1.5em] align-middle', className)} /> : <>{value}</>;
}
