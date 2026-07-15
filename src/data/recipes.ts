export interface Ingredient {
  id: string;
  label: string;
  emoji: string;
  color: string; // soft background for the layer pill
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  /** Ingredient ids, top to bottom — rendered in this order it looks like the real food. */
  layers: string[];
}

export const INGREDIENTS: Record<string, Ingredient> = {
  bun: { id: 'bun', label: '빵', emoji: '🍞', color: '#F6C87B' },
  patty: { id: 'patty', label: '패티', emoji: '🥩', color: '#C98A5E' },
  lettuce: { id: 'lettuce', label: '양상추', emoji: '🥬', color: '#A7D98A' },
  tomato: { id: 'tomato', label: '토마토', emoji: '🍅', color: '#F49189' },
  cheese: { id: 'cheese', label: '치즈', emoji: '🧀', color: '#FFDD7A' },
  egg: { id: 'egg', label: '계란', emoji: '🍳', color: '#FFE9B0' },
  bacon: { id: 'bacon', label: '베이컨', emoji: '🥓', color: '#F0A0A0' },
  onion: { id: 'onion', label: '양파', emoji: '🧅', color: '#E3C7EC' },
};

/** Ordered short → long so the game ramps up in difficulty. */
export const RECIPES: Recipe[] = [
  {
    id: 'cheeseburger',
    name: '치즈버거',
    emoji: '🍔',
    layers: ['bun', 'patty', 'cheese', 'bun'],
  },
  {
    id: 'sandwich',
    name: '샌드위치',
    emoji: '🥪',
    layers: ['bun', 'cheese', 'egg', 'lettuce', 'bun'],
  },
  {
    id: 'veggie',
    name: '야채버거',
    emoji: '🍔',
    layers: ['bun', 'lettuce', 'tomato', 'onion', 'bun'],
  },
  {
    id: 'breakfast',
    name: '아침 샌드위치',
    emoji: '🥪',
    layers: ['bun', 'egg', 'bacon', 'cheese', 'bun'],
  },
  {
    id: 'hamburger',
    name: '햄버거',
    emoji: '🍔',
    layers: ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'bun'],
  },
];

/** Distinct ingredients a recipe needs — the tap palette. */
export function paletteFor(recipe: Recipe): Ingredient[] {
  const seen = new Set<string>();
  const palette: Ingredient[] = [];
  for (const id of recipe.layers) {
    if (!seen.has(id)) {
      seen.add(id);
      palette.push(INGREDIENTS[id]);
    }
  }
  return palette;
}
