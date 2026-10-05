import type { LearningCategory } from '@/types/learning';
import type { PictureId } from './picture-content';

export interface ShapeItem {
  id: string;            // "shape-circle"
  slug: string;          // route segment: /shapes/circle
  character: string;     // glyph traced on the writing sheet
  name: string;          // 동그라미
  english: string;       // Circle
  category: LearningCategory;
  color: string;         // fill used by ShapeFigure and the list card
  description: string;   // one child-sized sentence about the shape
  corners: number;       // 0 for round shapes
  everyday: { picture: PictureId; name: string }[]; // 생활 속에서 찾기
}

export const SHAPES_DATA: ShapeItem[] = [
  { id: 'shape-circle', slug: 'circle', character: '○', name: '동그라미', english: 'Circle', category: 'shapes', color: '#FF6B6B',
    description: '뾰족한 곳 없이 동글동글 굴러가요.', corners: 0,
    everyday: [{ picture: 'soccer-ball', name: '축구공' }, { picture: 'doughnut', name: '도넛' }, { picture: 'cookie', name: '쿠키' }] },
  { id: 'shape-triangle', slug: 'triangle', character: '△', name: '세모', english: 'Triangle', category: 'shapes', color: '#FFB84D',
    description: '뾰족한 꼭짓점이 세 개 있어요.', corners: 3,
    everyday: [{ picture: 'tent', name: '텐트' }, { picture: 'pizza', name: '피자' }, { picture: 'christmas-tree', name: '트리' }] },
  { id: 'shape-square', slug: 'square', character: '□', name: '네모', english: 'Square', category: 'shapes', color: '#4ECDC4',
    description: '네 변의 길이가 모두 똑같아요.', corners: 4,
    everyday: [{ picture: 'dice', name: '주사위' }, { picture: 'window', name: '창문' }, { picture: 'gift', name: '선물 상자' }] },
  { id: 'shape-rectangle', slug: 'rectangle', character: '▭', name: '긴네모', english: 'Rectangle', category: 'shapes', color: '#54A0FF',
    description: '네모인데 한쪽이 더 길쭉해요.', corners: 4,
    everyday: [{ picture: 'door', name: '문' }, { picture: 'phone', name: '휴대폰' }, { picture: 'blue-book', name: '공책' }] },
  { id: 'shape-star', slug: 'star', character: '☆', name: '별', english: 'Star', category: 'shapes', color: '#FECA57',
    description: '밤하늘에서 반짝이는 뾰족한 모양이에요.', corners: 5,
    everyday: [{ picture: 'star', name: '별' }, { picture: 'glowing-star', name: '반짝별' }, { picture: 'sparkles', name: '반짝이' }] },
  { id: 'shape-heart', slug: 'heart', character: '♡', name: '하트', english: 'Heart', category: 'shapes', color: '#FF7EB3',
    description: '사랑해요 마음을 나타내는 모양이에요.', corners: 1,
    everyday: [{ picture: 'red-heart', name: '하트' }, { picture: 'strawberry', name: '딸기' }, { picture: 'heart-ribbon', name: '리본 하트' }] },
  { id: 'shape-diamond', slug: 'diamond', character: '◇', name: '마름모', english: 'Diamond', category: 'shapes', color: '#A29BFE',
    description: '네모를 살짝 돌려 세운 모양이에요.', corners: 4,
    everyday: [{ picture: 'kite', name: '연' }, { picture: 'gem', name: '보석' }, { picture: 'orange-diamond', name: '마름모 표지' }] },
  { id: 'shape-oval', slug: 'oval', character: '⬭', name: '타원', english: 'Oval', category: 'shapes', color: '#55E6C1',
    description: '동그라미를 길게 늘인 달걀 모양이에요.', corners: 0,
    everyday: [{ picture: 'egg', name: '달걀' }, { picture: 'football', name: '럭비공' }, { picture: 'lemon', name: '레몬' }] },
];

export function getShapeBySlug(slug: string): ShapeItem | undefined {
  return SHAPES_DATA.find((shape) => shape.slug === slug);
}

export function getShapeByCharacter(character: string): ShapeItem | undefined {
  return SHAPES_DATA.find((shape) => shape.character === character);
}
