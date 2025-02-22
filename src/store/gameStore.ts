import { create } from 'zustand';
import { Vector3 } from 'three';

interface PlacedBox {
  position: Vector3;
  id: string;
}

interface GameState {
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  phase: 'prep' | 'combat';
  placedBoxes: PlacedBox[];
  setCurrentLevel: (level: number) => void;
  setTimer: (time: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (spawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  setPhase: (phase: 'prep' | 'combat') => void;
  addBox: (position: Vector3) => void;
  removeBox: (id: string) => void;
  clearBoxes: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentLevel: 1,
  timer: 60,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  phase: 'prep',
  placedBoxes: [],
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setTimer: (time) => set({ timer: time }),
  setEnemiesAlive: (count) => set({ enemiesAlive: count }),
  setIsSpawning: (spawning) => set({ isSpawning: spawning }),
  setLevelComplete: (complete) => set({ levelComplete: complete }),
  setPhase: (phase) => set({ phase: phase }),
  addBox: (position) => set((state) => {
    if (state.placedBoxes.length >= 20) return state;
    return {
      placedBoxes: [...state.placedBoxes, {
        position,
        id: Math.random().toString(36).substr(2, 9)
      }]
    };
  }),
  removeBox: (id) => set((state) => ({
    placedBoxes: state.placedBoxes.filter(box => box.id !== id)
  })),
  clearBoxes: () => set({ placedBoxes: [] })
}));