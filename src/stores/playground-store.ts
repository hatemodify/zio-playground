import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ANIMALS, VEHICLES } from '@/data/picture-content';
export const PLAYGROUND_FRIENDS = [...ANIMALS, ...VEHICLES];
export type ToyId = typeof PLAYGROUND_FRIENDS[number]['id'];
export interface PlaygroundScene { theme: 'meadow' | 'beach' | 'night' | 'town' | 'construction'; cells: (ToyId | null)[] }
const emptyScene = (): PlaygroundScene => ({ theme: 'town', cells: Array.from({ length: 15 }, () => null) });
interface PlaygroundState { scene: PlaygroundScene; save: (scene: PlaygroundScene) => void; reset: () => void }
export const usePlaygroundStore = create<PlaygroundState>()(persist((set) => ({
  scene: emptyScene(), save: (scene) => set({ scene }), reset: () => set({ scene: emptyScene() }),
}), { name: 'kidsedu-playground', version: 1,
  merge: (saved, current) => {
    const scene = (saved as Partial<PlaygroundState> | undefined)?.scene;
    if (!scene || !['meadow', 'beach', 'night', 'town', 'construction'].includes(scene.theme) || !Array.isArray(scene.cells) || scene.cells.length !== 15) return current;
    return { ...current, scene: { theme: scene.theme, cells: scene.cells.map((id) => PLAYGROUND_FRIENDS.some((animal) => animal.id === id) ? id : null) } };
  },
}));
