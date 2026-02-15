import { create } from 'zustand';

export type RaceState = 'ready' | 'racing' | 'finished';

interface GameState {
  playerPosition: [number, number, number];
  velocity: [number, number, number];
  steerInput: number; // -1 izq, 0 centro, 1 der
  raceState: RaceState;
  currentLap: number;
  totalLaps: number;
  checkpointsPassed: number;
  raceStarted: boolean;
  currentMapId: string;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setVelocity: (vel: [number, number, number]) => void;
  setSteerInput: (v: number) => void;
  setRaceState: (state: RaceState) => void;
  setRaceStarted: (v: boolean) => void;
  setCurrentMapId: (id: string) => void;
  passCheckpoint: () => void;
  completeLap: () => void;
  resetRace: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerPosition: [0, 0.55, 0],
  velocity: [0, 0, 0],
  steerInput: 0,
  raceState: 'ready',
  currentLap: 0,
  totalLaps: 3,
  checkpointsPassed: 0,
  raceStarted: false,
  currentMapId: 'gp1',
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setVelocity: (vel) => set({ velocity: vel }),
  setSteerInput: (v) => set({ steerInput: v }),
  setRaceState: (state) => set({ raceState: state }),
  setRaceStarted: (v) => set({ raceStarted: v }),
  setCurrentMapId: (id) => set({ currentMapId: id }),
  passCheckpoint: () =>
    set((s) => ({ checkpointsPassed: s.checkpointsPassed + 1 })),
  completeLap: () =>
    set((s) => ({
      currentLap: s.currentLap + 1,
      checkpointsPassed: 0,
    })),
  resetRace: () =>
    set({
      raceState: 'ready',
      currentLap: 0,
      checkpointsPassed: 0,
      raceStarted: false,
    }),
}));
