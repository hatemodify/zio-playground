export const INGREDIENTS = {
  'bun-bottom': { id: 'bun-bottom', label: '아랫빵' },
  patty: { id: 'patty', label: '패티' },
  lettuce: { id: 'lettuce', label: '양상추' },
  tomato: { id: 'tomato', label: '토마토' },
  cheese: { id: 'cheese', label: '치즈' },
  egg: { id: 'egg', label: '달걀' },
  bacon: { id: 'bacon', label: '베이컨' },
  onion: { id: 'onion', label: '양파' },
  broccoli: { id: 'broccoli', label: '브로콜리' },
  carrot: { id: 'carrot', label: '당근' },
  corn: { id: 'corn', label: '옥수수' },
  apple: { id: 'apple', label: '사과' },
  grapes: { id: 'grapes', label: '포도' },
  orange: { id: 'orange', label: '오렌지' },
  pumpkin: { id: 'pumpkin', label: '단호박' },
  bread: { id: 'bread', label: '식빵' },
  dough: { id: 'dough', label: '피자 도우' },
  sauce: { id: 'sauce', label: '토마토소스' },
  mushroom: { id: 'mushroom', label: '버섯' },
  pancake: { id: 'pancake', label: '팬케이크' },
  cream: { id: 'cream', label: '생크림' },
  strawberry: { id: 'strawberry', label: '딸기' },
  banana: { id: 'banana', label: '바나나' },
  syrup: { id: 'syrup', label: '시럽' },
  'bun-top': { id: 'bun-top', label: '윗빵' },
} as const;
export type IngredientId = keyof typeof INGREDIENTS;
export type Ingredient = typeof INGREDIENTS[IngredientId];
export type FoodKind = 'burger' | 'pizza' | 'sandwich' | 'pancakes';
export const FOOD_KINDS: { id: FoodKind; name: string; image: string }[] = [
  { id: 'burger', name: '햄버거', image: '/assets/illustrations/burger.svg' },
  { id: 'pizza', name: '피자', image: '/assets/twemoji/pizza.svg' },
  { id: 'sandwich', name: '샌드위치', image: '/assets/twemoji/sandwich.svg' },
  { id: 'pancakes', name: '팬케이크', image: '/assets/twemoji/pancakes.svg' },
];
export interface Recipe {
  kind: FoodKind;
  id: string;
  name: string;
  /** Ingredients are placed in recipe order. */
  layers: IngredientId[];
}
export const RECIPES: Recipe[] = [
  { kind: 'burger', id: 'cheeseburger', name: '치즈버거', layers: ['bun-bottom', 'patty', 'cheese', 'bun-top'] },
  { kind: 'burger', id: 'egg', name: '달걀버거', layers: ['bun-bottom', 'egg', 'lettuce', 'bun-top'] },
  { kind: 'burger', id: 'veggie', name: '채소버거', layers: ['bun-bottom', 'lettuce', 'tomato', 'onion', 'bun-top'] },
  { kind: 'burger', id: 'breakfast', name: '아침버거', layers: ['bun-bottom', 'egg', 'bacon', 'cheese', 'bun-top'] },
  { kind: 'burger', id: 'hamburger', name: '클래식버거', layers: ['bun-bottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bun-top'] },
  { kind: 'burger', id: 'double', name: '더블치즈버거', layers: ['bun-bottom', 'patty', 'cheese', 'patty', 'cheese', 'bun-top'] },
  { kind: 'burger', id: 'garden', name: '정원버거', layers: ['bun-bottom', 'lettuce', 'tomato', 'cheese', 'onion', 'egg', 'bun-top'] },
  { kind: 'burger', id: 'special', name: '스페셜버거', layers: ['bun-bottom', 'patty', 'cheese', 'bacon', 'egg', 'lettuce', 'tomato', 'bun-top'] },
  { kind: 'burger', id: 'rainbow', name: '무지개 버거', layers: ['bun-bottom', 'lettuce', 'tomato', 'cheese', 'broccoli', 'corn', 'bun-top'] },
  { kind: 'burger', id: 'crunchy', name: '아삭 버거', layers: ['bun-bottom', 'patty', 'carrot', 'lettuce', 'tomato', 'bun-top'] },
  ...(['mushroom', 'tomato', 'onion', 'bacon', 'egg', 'broccoli', 'corn', 'pumpkin'] as const).map((topping): Recipe => ({ kind: 'pizza', id: `pizza-${topping}`, name: `${INGREDIENTS[topping].label} 피자`, layers: ['dough', 'sauce', 'cheese', topping, 'lettuce'] })),
  ...(['egg', 'bacon', 'cheese', 'patty', 'onion', 'broccoli', 'carrot', 'corn', 'apple'] as const).map((topping): Recipe => ({ kind: 'sandwich', id: `sandwich-${topping}`, name: `${INGREDIENTS[topping].label} 샌드위치`, layers: ['bread', 'lettuce', topping, 'tomato', 'bread'] })),
  ...([
    ['pancake', 'pancake', 'cream', 'strawberry', 'syrup'],
    ['pancake', 'banana', 'pancake', 'cream', 'syrup'],
    ['pancake', 'cream', 'strawberry', 'banana', 'syrup'],
    ['pancake', 'pancake', 'banana', 'strawberry', 'syrup'],
    ['pancake', 'cream', 'pancake', 'strawberry', 'syrup'],
    ['pancake', 'apple', 'cream', 'grapes', 'syrup'],
    ['pancake', 'orange', 'cream', 'banana', 'syrup'],
  ] as IngredientId[][]).map((layers, index): Recipe => ({ kind: 'pancakes', id: `pancakes-${index}`, name: ['딸기 팬케이크', '바나나 팬케이크', '과일 팬케이크', '무지개 팬케이크', '크림 팬케이크', '사과 포도 팬케이크', '오렌지 바나나 팬케이크'][index], layers })),
];
export function paletteFor(recipe: Recipe): Ingredient[] {
  return [...new Set(recipe.layers)].map((id) => INGREDIENTS[id]);
}
