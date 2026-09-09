export const INGREDIENTS = {
  'bun-bottom': { id: 'bun-bottom', label: '아랫빵' },
  patty: { id: 'patty', label: '패티' },
  lettuce: { id: 'lettuce', label: '양상추' },
  tomato: { id: 'tomato', label: '토마토' },
  cheese: { id: 'cheese', label: '치즈' },
  egg: { id: 'egg', label: '달걀' },
  bacon: { id: 'bacon', label: '베이컨' },
  onion: { id: 'onion', label: '양파' },
  'bun-top': { id: 'bun-top', label: '윗빵' },
} as const;
export type IngredientId = keyof typeof INGREDIENTS;
export type Ingredient = typeof INGREDIENTS[IngredientId];
export interface Recipe {
  id: string;
  name: string;
  /** Build from the plate upward. The first ingredient is always the bottom bun. */
  layers: IngredientId[];
}
export const RECIPES: Recipe[] = [
  { id: 'cheeseburger', name: '치즈버거', layers: ['bun-bottom', 'patty', 'cheese', 'bun-top'] },
  { id: 'egg', name: '달걀버거', layers: ['bun-bottom', 'egg', 'lettuce', 'bun-top'] },
  { id: 'veggie', name: '채소버거', layers: ['bun-bottom', 'lettuce', 'tomato', 'onion', 'bun-top'] },
  { id: 'breakfast', name: '아침버거', layers: ['bun-bottom', 'egg', 'bacon', 'cheese', 'bun-top'] },
  { id: 'hamburger', name: '클래식버거', layers: ['bun-bottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bun-top'] },
  { id: 'double', name: '더블치즈버거', layers: ['bun-bottom', 'patty', 'cheese', 'patty', 'cheese', 'bun-top'] },
  { id: 'garden', name: '정원버거', layers: ['bun-bottom', 'lettuce', 'tomato', 'cheese', 'onion', 'egg', 'bun-top'] },
  { id: 'special', name: '스페셜버거', layers: ['bun-bottom', 'patty', 'cheese', 'bacon', 'egg', 'lettuce', 'tomato', 'bun-top'] },
];
export function paletteFor(recipe: Recipe): Ingredient[] {
  return [...new Set(recipe.layers)].map((id) => INGREDIENTS[id]);
}
