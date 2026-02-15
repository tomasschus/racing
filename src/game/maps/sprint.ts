import type { MapDefinition } from './types';

// Sprint corto: recta + curva cerrada. Línea en x ≈ 0, vuelta válida si minX < -8.
const LINE_X = 0;
const MIN_X_BEFORE_LAP = -8;

export const sprintMap: MapDefinition = {
  id: 'sprint',
  name: 'Sprint',
  trackPoints: [
    [0, 0],
    [40, 0],
    [80, 0],
    [100, 10],
    [110, 40],
    [105, 70],
    [80, 95],
    [50, 100],
    [20, 90],
    [0, 70],
    [-15, 45],
    [-10, 15],
    [-5, 5],
  ],
  roadWidth: 24,
  wallHeight: 2.5,
  wallThickness: 1,
  lap: {
    getSideOfLine: (position) => (position[0] < LINE_X ? 'a' : 'b'),
    isValidLapCrossing: (ctx) =>
      ctx.minX !== null && ctx.minX < MIN_X_BEFORE_LAP,
  },
  spawnPosition: [4, 0.55, 0],
  spawnRotation: [0, -Math.PI / 2, 0],
  totalLaps: 5,
};
