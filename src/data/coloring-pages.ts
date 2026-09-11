import artwork from './coloring-artwork.json';

export type ColoringCategory = 'animals' | 'vehicles' | 'nature' | 'food' | 'objects';
export interface ColoringRegion { id: string; label: string; d: string; color: string }
export interface ColoringPage {
  id: string;
  name: string;
  emoji: string;
  category: ColoringCategory;
  viewBox: string;
  source: string;
  regions: ColoringRegion[];
  artwork: { d: string; color: string; regionId?: string; transform?: string }[];
}
export const COLORING_CATEGORIES: { key: ColoringCategory; label: string; emoji: string }[] = [
  { key: 'animals', label: '동물', emoji: '🐾' },
  { key: 'vehicles', label: '탈것', emoji: '🚗' },
  { key: 'nature', label: '자연', emoji: '🌿' },
  { key: 'food', label: '음식', emoji: '🍓' },
  { key: 'objects', label: '장난감', emoji: '🎈' },
];
// Adapted Twemoji graphics. Attribution and changes: public/assets/twemoji/CREDITS.md.
export const COLORING_PAGES = artwork as ColoringPage[];
export function pagesByCategory(category: ColoringCategory) {
  return COLORING_PAGES.filter((page) => page.category === category);
}
